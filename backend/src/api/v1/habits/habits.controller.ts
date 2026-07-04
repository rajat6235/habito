import { Request, Response, NextFunction } from 'express';
import { HabitFrequency, HabitLogStatus, Prisma } from '@prisma/client';
import { container } from '../../../container';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { sendSuccess, sendCreated, sendPaginated } from '../../../utils/response';
import {
  CreateHabitInput,
  UpdateHabitInput,
  LogHabitInput,
  ListHabitsQuery,
  HabitLogsQuery,
  CreateCategoryInput,
} from './habits.validation';

const habitRepo = container.habitRepository;

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await prisma.habitCategory.findMany({
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
    const body = req.body as CreateCategoryInput;

    const category = await prisma.habitCategory.create({
      data: {
        userId:    req.user!.id,
        name:      body.name,
        isGlobal:  false,
        sortOrder: body.sortOrder ?? 0,
        // Only include optional fields when they have values
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.icon  !== undefined ? { icon:  body.icon  } : {}),
      },
    });

    sendCreated(res, category);
  } catch (err) {
    next(err);
  }
}

// ── Habits ────────────────────────────────────────────────────────────────────

export async function listHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListHabitsQuery;
    const { archived, categoryId, cursor, limit } = query;

    const results = await habitRepo.findAll(req.user!.id, {
      limit,
      ...(archived   !== undefined ? { isArchived: archived }  : {}),
      ...(categoryId !== undefined ? { categoryId }             : {}),
      ...(cursor     !== undefined ? { cursor }                 : {}),
    });

    const hasNextPage = results.length > limit;
    const data        = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor  = hasNextPage ? data.at(-1)!.id : null;

    sendPaginated(res, data, { hasNextPage, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body         = req.body as CreateHabitInput;
    const frequencyType = body.frequencyConfig.type as HabitFrequency;

    const habit = await prisma.habit.create({
      data: {
        user:            { connect: { id: req.user!.id } },
        title:           body.title,
        frequencyType,
        frequencyConfig: body.frequencyConfig as Prisma.InputJsonValue,
        priority:        body.priority,
        reminderEnabled: body.reminderEnabled,
        startDate:       body.startDate ? new Date(body.startDate) : new Date(),
        // Optional fields — only include when defined
        ...(body.categoryId     ? { category:      { connect: { id: body.categoryId } } } : {}),
        ...(body.description   !== undefined ? { description:   body.description }   : {}),
        ...(body.icon          !== undefined ? { icon:          body.icon }           : {}),
        ...(body.color         !== undefined ? { color:         body.color }          : {}),
        ...(body.reminderConfig !== undefined ? { reminderConfig: body.reminderConfig as Prisma.InputJsonValue } : {}),
        ...(body.endDate        !== undefined ? { endDate: new Date(body.endDate) }   : {}),
      },
    });

    sendCreated(res, habit);
  } catch (err) {
    next(err);
  }
}

export async function getHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    sendSuccess(res, habit);
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as UpdateHabitInput;

    const existing = await habitRepo.findById(id, req.user!.id);
    if (!existing) throw AppError.notFound('Habit');

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(body.title           !== undefined ? { title:           body.title }           : {}),
        ...(body.description     !== undefined ? { description:     body.description }     : {}),
        ...(body.categoryId      !== undefined ? { categoryId:      body.categoryId }      : {}),
        ...(body.icon            !== undefined ? { icon:            body.icon }            : {}),
        ...(body.color           !== undefined ? { color:           body.color }           : {}),
        ...(body.priority        !== undefined ? { priority:        body.priority }        : {}),
        ...(body.reminderEnabled !== undefined ? { reminderEnabled: body.reminderEnabled } : {}),
        ...(body.reminderConfig  !== undefined ? { reminderConfig:  body.reminderConfig as Prisma.InputJsonValue } : {}),
        ...(body.startDate       !== undefined ? { startDate:       new Date(body.startDate) } : {}),
        ...(body.endDate         !== undefined ? { endDate:         new Date(body.endDate) }   : {}),
        ...(body.frequencyConfig !== undefined ? {
          frequencyConfig: body.frequencyConfig as Prisma.InputJsonValue,
          frequencyType:   body.frequencyConfig.type as HabitFrequency,
        } : {}),
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await habitRepo.findById(id, req.user!.id);
    if (!existing) throw AppError.notFound('Habit');

    await habitRepo.softDelete(id);

    sendSuccess(res, { message: 'Habit deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function archiveHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const newArchived = !habit.isArchived;
    await habitRepo.archive(id, newArchived);

    sendSuccess(res, { archived: newArchived });
  } catch (err) {
    next(err);
  }
}

// ── Habit Logs ────────────────────────────────────────────────────────────────

export async function logHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as LogHabitInput;

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const logDate = new Date(body.date);

    const log = await habitRepo.upsertLog({
      habitId: id,
      userId:  req.user!.id,
      logDate,
      status:  body.status as HabitLogStatus,
      ...(body.value      !== undefined ? { value:      body.value      } : {}),
      ...(body.note       !== undefined ? { note:       body.note       } : {}),
      ...(body.skipReason !== undefined ? { skipReason: body.skipReason } : {}),
    });

    if (body.status === 'completed') {
      const newStreak = habit.currentStreak + 1;
      await prisma.habit.update({
        where: { id },
        data: {
          totalCompletions:  { increment: 1 },
          currentStreak:     newStreak,
          longestStreak:     newStreak > habit.longestStreak ? newStreak : habit.longestStreak,
          lastCompletedDate: logDate,
        },
      });
    }

    sendCreated(res, log);
  } catch (err) {
    next(err);
  }
}

export async function deleteLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, date } = req.params as { id: string; date: string };
    const logDate = new Date(date);

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const log = await habitRepo.findLog(id, logDate);
    if (!log) throw AppError.notFound('Habit log');

    await prisma.habitLog.delete({
      where: { habitId_logDate: { habitId: id, logDate } },
    });

    sendSuccess(res, { message: 'Log deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getHabitLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const query  = req.query as unknown as HabitLogsQuery;

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const from = new Date(query.from);
    const to   = new Date(query.to);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        logDate: { gte: from, lte: to },
      },
      orderBy: { logDate: 'desc' },
      take:    query.limit + 1,
      ...(query.cursor !== undefined ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = logs.length > query.limit;
    const data        = hasNextPage ? logs.slice(0, query.limit) : logs;
    const nextCursor  = hasNextPage ? data.at(-1)!.id : null;

    sendPaginated(res, data, { hasNextPage, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function getTodayHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Midnight-UTC Date to match the @db.Date column
    const now   = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const habits = await habitRepo.getTodayHabits(req.user!.id, today);

    sendSuccess(res, habits);
  } catch (err) {
    next(err);
  }
}
