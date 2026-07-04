import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { ErrorCode } from '../../../errors/errorCodes';
import { sendSuccess, sendCreated } from '../../../utils/response';
import {
  CreateGoalInput,
  UpdateGoalInput,
  UpdateGoalProgressInput,
  CreateMilestoneInput,
  ListGoalsQuery,
} from './goals.validation';

export async function listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListGoalsQuery;
    const { status, category, type, cursor, limit, sort, order } = query;

    const where: Prisma.GoalWhereInput = {
      userId: req.user!.id,
      deletedAt: null,
      ...(status   && { status }),
      ...(category && { category }),
      ...(type     && { goalType: type }),
    };

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { [sort]: order },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { habitLinks: true } },
      },
    });

    const hasNextPage = goals.length > limit;
    const items = hasNextPage ? goals.slice(0, limit) : goals;
    const nextCursor = hasNextPage ? items[items.length - 1]!.id : null;

    sendSuccess(res, items, 200, {
      pagination: { hasNextPage, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateGoalInput;

    const goal = await prisma.goal.create({
      data: {
        userId:       req.user!.id,
        title:        body.title,
        description:  body.description  ?? null,
        category:     body.category,
        goalType:     body.goalType,
        progressType: body.progressType,
        targetValue:  body.targetValue != null ? new Prisma.Decimal(body.targetValue) : null,
        unit:         body.unit         ?? null,
        priority:     body.priority,
        targetDate:   body.targetDate ? new Date(body.targetDate) : null,
        milestones: {
          create: body.milestones.map((m, i) => ({
            title:       m.title,
            targetValue: m.targetValue != null ? new Prisma.Decimal(m.targetValue) : null,
            targetDate:  m.targetDate ? new Date(m.targetDate) : null,
            notes:       m.notes ?? null,
            sortOrder:   i,
          })),
        },
        ...(body.habitIds.length > 0 && {
          habitLinks: {
            create: body.habitIds.map(habitId => ({ habitId })),
          },
        }),
      },
      include: {
        milestones:  { orderBy: { sortOrder: 'asc' } },
        habitLinks:  true,
        _count:      { select: { habitLinks: true } },
      },
    });

    sendCreated(res, goal);
  } catch (err) {
    next(err);
  }
}

export async function getGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
      include: {
        milestones:  { orderBy: { sortOrder: 'asc' } },
        habitLinks:  true,
        _count:      { select: { habitLinks: true } },
      },
    });

    if (!goal) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    sendSuccess(res, goal);
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateGoalInput;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(body.title        !== undefined && { title: body.title }),
        ...(body.description  !== undefined && { description: body.description }),
        ...(body.category     !== undefined && { category: body.category }),
        ...(body.goalType     !== undefined && { goalType: body.goalType }),
        ...(body.progressType !== undefined && { progressType: body.progressType }),
        ...(body.targetValue  !== undefined && {
          targetValue: body.targetValue != null ? new Prisma.Decimal(body.targetValue) : null,
        }),
        ...(body.unit         !== undefined && { unit: body.unit }),
        ...(body.priority     !== undefined && { priority: body.priority }),
        ...(body.targetDate   !== undefined && {
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
        }),
      },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        habitLinks: true,
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateGoalProgressInput;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    const progressPct   = body.progressPct   != null ? new Prisma.Decimal(body.progressPct)   : existing.progressPct;
    const currentValue  = body.currentValue  != null ? new Prisma.Decimal(body.currentValue)  : existing.currentValue;
    const isComplete    = Number(progressPct) >= 100;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        progressPct,
        currentValue,
        ...(isComplete && existing.status !== 'completed' && {
          status:      'completed',
          completedAt: new Date(),
        }),
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    await prisma.goal.update({
      where: { id },
      data:  { deletedAt: new Date() },
    });

    sendSuccess(res, { message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
}

export async function addMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as CreateMilestoneInput;

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    const count = await prisma.goalMilestone.count({ where: { goalId: id } });

    const milestone = await prisma.goalMilestone.create({
      data: {
        goalId:      id,
        title:       body.title,
        targetValue: body.targetValue != null ? new Prisma.Decimal(body.targetValue) : null,
        targetDate:  body.targetDate  ? new Date(body.targetDate) : null,
        sortOrder:   body.sortOrder   ?? count,
        notes:       body.notes ?? null,
      },
    });

    sendCreated(res, milestone);
  } catch (err) {
    next(err);
  }
}

export async function completeMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, milestoneId } = req.params as { id: string; milestoneId: string };

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    const milestone = await prisma.goalMilestone.findFirst({
      where: { id: milestoneId, goalId: id },
    });
    if (!milestone) throw AppError.notFound('Milestone', ErrorCode.MILESTONE_NOT_FOUND);

    const updated = await prisma.goalMilestone.update({
      where: { id: milestoneId },
      data:  { isCompleted: true, completedAt: new Date() },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, milestoneId } = req.params as { id: string; milestoneId: string };

    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Goal', ErrorCode.GOAL_NOT_FOUND);

    const milestone = await prisma.goalMilestone.findFirst({
      where: { id: milestoneId, goalId: id },
    });
    if (!milestone) throw AppError.notFound('Milestone', ErrorCode.MILESTONE_NOT_FOUND);

    await prisma.goalMilestone.delete({ where: { id: milestoneId } });

    sendSuccess(res, { message: 'Milestone deleted' });
  } catch (err) {
    next(err);
  }
}
