import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { sendSuccess, sendCreated, sendPaginated } from '../../../utils/response';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from './expenses.validation';

const expenseWithItems = {
  category: true,
  items:    { orderBy: { sortOrder: 'asc' as const } },
};

type ExpenseWithItems = Prisma.ExpenseGetPayload<{ include: typeof expenseWithItems }>;

function serializeExpense(expense: ExpenseWithItems) {
  const items = expense.items.map(item => ({
    id:       item.id,
    name:     item.name,
    quantity: item.quantity ? Number(item.quantity) : null,
    unit:     item.unit,
    amount:   Number(item.amount),
  }));
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    id:         expense.id,
    categoryId: expense.categoryId,
    category:   expense.category,
    title:      expense.title,
    date:       expense.expenseDate.toISOString().slice(0, 10),
    note:       expense.note,
    items,
    total,
    createdAt:  expense.createdAt,
    updatedAt:  expense.updatedAt,
  };
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { userId: req.user!.id },
        ],
      },
      orderBy: [{ isGlobal: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateExpenseCategoryInput;

    const category = await prisma.expenseCategory.create({
      data: {
        userId:   req.user!.id,
        name:     body.name,
        isGlobal: false,
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.icon  !== undefined ? { icon:  body.icon  } : {}),
      },
    });

    sendCreated(res, category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as UpdateExpenseCategoryInput;

    const existing = await prisma.expenseCategory.findFirst({
      where: { id, OR: [{ userId: req.user!.id }, { isGlobal: true }] },
    });
    if (!existing) throw AppError.notFound('Expense category');

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(body.name  !== undefined ? { name:  body.name }  : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.icon  !== undefined ? { icon:  body.icon }  : {}),
      },
    });

    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.expenseCategory.findFirst({
      where: { id, OR: [{ userId: req.user!.id }, { isGlobal: true }] },
    });
    if (!existing) throw AppError.notFound('Expense category');

    const activeCount = await prisma.expense.count({ where: { categoryId: id, deletedAt: null } });
    if (activeCount > 0) {
      throw AppError.conflict(`Cannot delete — ${activeCount} expense${activeCount > 1 ? 's use' : ' uses'} this category`);
    }

    // Permanently remove any soft-deleted expenses still holding this FK, then delete the category
    await prisma.$transaction(async (tx) => {
      const softDeleted = await tx.expense.findMany({
        where:  { categoryId: id, deletedAt: { not: null } },
        select: { id: true },
      });
      if (softDeleted.length > 0) {
        const ids = softDeleted.map(e => e.id);
        await tx.expenseItem.deleteMany({ where: { expenseId: { in: ids } } });
        await tx.expense.deleteMany({ where: { id: { in: ids } } });
      }
      await tx.expenseCategory.delete({ where: { id } });
    });

    sendSuccess(res, { message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ── Summary (dashboard) ──────────────────────────────────────────────────────

export async function getExpenseSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const today    = new Date(`${todayStr}T00:00:00.000Z`);
    const weekStart  = new Date(today);
    weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay());
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setUTCDate(weekStart.getUTCDate() - 7);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    const expenses = await prisma.expense.findMany({
      where:  { userId: req.user!.id, deletedAt: null },
      select: {
        id:          true,
        title:       true,
        expenseDate: true,
        categoryId:  true,
        category:    { select: { name: true, color: true, icon: true } },
        items:       { select: { amount: true } },
      },
    });

    let todayTotal = 0, weekTotal = 0, lastWeekTotal = 0, monthTotal = 0, yearTotal = 0;
    const byCategory = new Map<string, {
      categoryId: string; name: string; color: string | null; icon: string | null;
      total: number; sessionCount: number;
    }>();
    let largestSession: {
      id: string; title: string | null; categoryName: string; categoryColor: string | null;
      amount: number; date: string;
    } | null = null;

    for (const expense of expenses) {
      const entryTotal = expense.items.reduce((sum, item) => sum + Number(item.amount), 0);

      if (expense.expenseDate.getUTCFullYear() === today.getUTCFullYear()) yearTotal += entryTotal;
      if (expense.expenseDate >= monthStart) monthTotal += entryTotal;
      if (expense.expenseDate >= weekStart)  weekTotal  += entryTotal;
      if (expense.expenseDate >= lastWeekStart && expense.expenseDate < weekStart) lastWeekTotal += entryTotal;
      if (expense.expenseDate.getTime() === today.getTime()) todayTotal += entryTotal;

      if (!largestSession || entryTotal > largestSession.amount) {
        largestSession = {
          id:            expense.id,
          title:         expense.title,
          categoryName:  expense.category.name,
          categoryColor: expense.category.color,
          amount:        entryTotal,
          date:          expense.expenseDate.toISOString().slice(0, 10),
        };
      }

      const existing = byCategory.get(expense.categoryId);
      if (existing) {
        existing.total += entryTotal;
        existing.sessionCount += 1;
      } else {
        byCategory.set(expense.categoryId, {
          categoryId:   expense.categoryId,
          name:         expense.category.name,
          color:        expense.category.color,
          icon:         expense.category.icon,
          total:        entryTotal,
          sessionCount: 1,
        });
      }
    }

    const weekChangePct = lastWeekTotal > 0
      ? Math.round(((weekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : null;

    sendSuccess(res, {
      today:      todayTotal,
      thisWeek:   weekTotal,
      lastWeek:   lastWeekTotal,
      weekChangePct,
      thisMonth:  monthTotal,
      thisYear:   yearTotal,
      totalSessions: expenses.length,
      largestSession,
      byCategory: Array.from(byCategory.values())
        .map(c => ({ ...c, avgSession: Math.round(c.total / c.sessionCount) }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit, categoryId, from, to } = req.query as unknown as ListExpensesQuery;

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.user!.id,
        deletedAt: null,
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(from !== undefined || to !== undefined ? {
          expenseDate: {
            ...(from !== undefined ? { gte: new Date(from) } : {}),
            ...(to   !== undefined ? { lte: new Date(to)   } : {}),
          },
        } : {}),
      },
      include: expenseWithItems,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
      take:    limit + 1,
      ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = expenses.length > limit;
    const data         = hasNextPage ? expenses.slice(0, limit) : expenses;
    const nextCursor    = hasNextPage ? data.at(-1)!.id : null;

    sendPaginated(res, data.map(serializeExpense), { hasNextPage, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateExpenseInput;

    const category = await prisma.expenseCategory.findFirst({
      where: { id: body.categoryId, OR: [{ isGlobal: true }, { userId: req.user!.id }] },
    });
    if (!category) throw AppError.notFound('Expense category');

    const expense = await prisma.expense.create({
      data: {
        userId:      req.user!.id,
        categoryId:  body.categoryId,
        expenseDate: new Date(body.date),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.note  !== undefined ? { note:  body.note  } : {}),
        items: {
          create: body.items.map((item, index) => ({
            name:     item.name,
            unit:     item.unit ?? null,
            quantity: item.quantity ?? null,
            amount:   item.amount,
            sortOrder: index,
          })),
        },
      },
      include: expenseWithItems,
    });

    sendCreated(res, serializeExpense(expense));
  } catch (err) {
    next(err);
  }
}

export async function getExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const expense = await prisma.expense.findFirst({
      where:   { id, userId: req.user!.id, deletedAt: null },
      include: expenseWithItems,
    });
    if (!expense) throw AppError.notFound('Expense');

    sendSuccess(res, serializeExpense(expense));
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as UpdateExpenseInput;

    const existing = await prisma.expense.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Expense');

    if (body.categoryId !== undefined) {
      const category = await prisma.expenseCategory.findFirst({
        where: { id: body.categoryId, OR: [{ isGlobal: true }, { userId: req.user!.id }] },
      });
      if (!category) throw AppError.notFound('Expense category');
    }

    const expense = await prisma.$transaction(async (tx) => {
      if (body.items !== undefined) {
        await tx.expenseItem.deleteMany({ where: { expenseId: id } });
      }

      return tx.expense.update({
        where: { id },
        data: {
          ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
          ...(body.title      !== undefined ? { title:      body.title }      : {}),
          ...(body.date       !== undefined ? { expenseDate: new Date(body.date) } : {}),
          ...(body.note       !== undefined ? { note:       body.note }       : {}),
          ...(body.items      !== undefined ? {
            items: {
              create: body.items.map((item, index) => ({
                name:      item.name,
                unit:      item.unit ?? null,
                quantity:  item.quantity ?? null,
                amount:    item.amount,
                sortOrder: index,
              })),
            },
          } : {}),
        },
        include: expenseWithItems,
      });
    });

    sendSuccess(res, serializeExpense(expense));
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.expense.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Expense');

    await prisma.expense.update({
      where: { id },
      data:  { deletedAt: new Date() },
    });

    sendSuccess(res, { message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
}
