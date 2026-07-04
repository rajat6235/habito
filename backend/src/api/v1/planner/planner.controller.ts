import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { ErrorCode } from '../../../errors/errorCodes';
import { sendSuccess, sendCreated } from '../../../utils/response';
import {
  CreateTaskInput,
  UpdateTaskInput,
  CarryOverInput,
  ReorderTasksInput,
} from './planner.validation';

export async function getDayPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.params as { date: string };

    const tasks = await prisma.plannerTask.findMany({
      where: {
        userId:   req.user!.id,
        planDate: new Date(date),
      },
      orderBy: [{ timeBlock: 'asc' }, { sortOrder: 'asc' }],
    });

    type TaskList = typeof tasks;
    const grouped: Record<string, TaskList> = {
      morning:   [],
      afternoon: [],
      evening:   [],
      night:     [],
    };

    for (const task of tasks) {
      grouped[task.timeBlock]!.push(task);
    }

    sendSuccess(res, grouped);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateTaskInput;

    const task = await prisma.plannerTask.create({
      data: {
        userId:       req.user!.id,
        goalId:       body.goalId       ?? null,
        planDate:     new Date(body.planDate),
        timeBlock:    body.timeBlock,
        title:        body.title,
        notes:        body.notes        ?? null,
        priority:     body.priority,
        estimatedMin: body.estimatedMin ?? null,
        sortOrder:    body.sortOrder,
      },
    });

    sendCreated(res, task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateTaskInput;

    const existing = await prisma.plannerTask.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw AppError.notFound('Task', ErrorCode.NOT_FOUND);

    const isCompleting   = body.isCompleted === true  && !existing.isCompleted;
    const isUncompleting = body.isCompleted === false && existing.isCompleted;

    const updated = await prisma.plannerTask.update({
      where: { id },
      data: {
        ...(body.timeBlock    !== undefined && { timeBlock: body.timeBlock }),
        ...(body.title        !== undefined && { title: body.title }),
        ...(body.notes        !== undefined && { notes: body.notes }),
        ...(body.priority     !== undefined && { priority: body.priority }),
        ...(body.estimatedMin !== undefined && { estimatedMin: body.estimatedMin }),
        ...(body.actualMin    !== undefined && { actualMin: body.actualMin }),
        ...(body.sortOrder    !== undefined && { sortOrder: body.sortOrder }),
        ...(body.goalId       !== undefined && { goalId: body.goalId }),
        ...(body.isCompleted  !== undefined && { isCompleted: body.isCompleted }),
        ...(isCompleting   && { completedAt: new Date() }),
        ...(isUncompleting && { completedAt: null }),
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.plannerTask.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw AppError.notFound('Task', ErrorCode.NOT_FOUND);

    await prisma.plannerTask.delete({ where: { id } });

    sendSuccess(res, { message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

export async function reorderTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ReorderTasksInput;

    // Verify all tasks belong to the current user
    const taskIds = body.tasks.map(t => t.id);
    const owned = await prisma.plannerTask.findMany({
      where: { id: { in: taskIds }, userId: req.user!.id },
      select: { id: true },
    });

    if (owned.length !== taskIds.length) {
      throw AppError.forbidden('One or more tasks not found or not owned by you');
    }

    // Bulk update sortOrder and optional timeBlock
    await prisma.$transaction(
      body.tasks.map(t =>
        prisma.plannerTask.update({
          where: { id: t.id },
          data: {
            sortOrder: t.sortOrder,
            ...(t.timeBlock !== undefined && { timeBlock: t.timeBlock }),
          },
        }),
      ),
    );

    sendSuccess(res, { message: 'Tasks reordered' });
  } catch (err) {
    next(err);
  }
}

export async function carryOver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CarryOverInput;
    const { fromDate, toDate, taskIds } = body;

    const fromDateObj = new Date(fromDate);
    const toDateObj   = new Date(toDate);

    // Fetch the specified incomplete tasks from fromDate that belong to this user
    const tasks = await prisma.plannerTask.findMany({
      where: {
        id:          { in: taskIds },
        userId:      req.user!.id,
        planDate:    fromDateObj,
        isCompleted: false,
      },
    });

    if (tasks.length === 0) {
      sendSuccess(res, { carried: 0, tasks: [] });
      return;
    }

    const created = await prisma.$transaction(
      tasks.map(t =>
        prisma.plannerTask.create({
          data: {
            userId:       t.userId,
            goalId:       t.goalId       ?? null,
            planDate:     toDateObj,
            timeBlock:    t.timeBlock,
            title:        t.title,
            notes:        t.notes        ?? null,
            priority:     t.priority,
            estimatedMin: t.estimatedMin ?? null,
            sortOrder:    t.sortOrder,
            carriedOver:  true,
            originalDate: fromDateObj,
          },
        }),
      ),
    );

    sendCreated(res, { carried: created.length, tasks: created });
  } catch (err) {
    next(err);
  }
}
