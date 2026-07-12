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
  UpdateLogInput,
  ListHabitsQuery,
  HabitLogsQuery,
  CreateCategoryInput,
} from './habits.validation';
import { recalculateHabitStreak } from '../../../services/streak.service';

const habitRepo = container.habitRepository;

function getTimesPerDay(frequencyConfig: Record<string, unknown>): number {
  const type = frequencyConfig['type'];
  const tpd  = frequencyConfig['timesPerDay'];
  if (type === 'custom_daily' && typeof tpd === 'number') return tpd;
  if (type === 'twice_daily') return 2;
  return 1;
}

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
        ...(body.categoryId     ? { category:      { connect: { id: body.categoryId } } } : {}),
        ...(body.description   !== undefined ? { description:   body.description }   : {}),
        ...(body.icon          !== undefined ? { icon:          body.icon }           : {}),
        ...(body.color         !== undefined ? { color:         body.color }          : {}),
        ...(body.reminderConfig !== undefined ? { reminderConfig: body.reminderConfig as Prisma.InputJsonValue } : {}),
        ...(body.endDate        !== undefined ? { endDate: new Date(body.endDate) }   : {}),
        ...(body.customFields   !== undefined ? { customFields:   body.customFields as Prisma.InputJsonValue }   : {}),
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
        ...(body.customFields !== undefined ? { customFields: body.customFields as Prisma.InputJsonValue } : {}),
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
    const body    = req.body as LogHabitInput;
    const logDate = new Date(body.date);

    // Block future dates using UTC comparison
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (body.date > todayUTC) {
      throw AppError.badRequest('Cannot log for future dates', 'FUTURE_DATE_NOT_ALLOWED');
    }

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const timesPerDay = getTimesPerDay(habit.frequencyConfig as Record<string, unknown>);

    // Atomic read-modify-write inside a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const existingLog  = await tx.habitLog.findUnique({
        where: { habitId_logDate: { habitId: id, logDate } },
      });
      const currentCount = (existingLog as { completionCount?: number } | null)?.completionCount ?? 0;

      if (body.status === 'completed' && currentCount >= timesPerDay) {
        throw AppError.badRequest(
          `Already logged ${timesPerDay}/${timesPerDay} times for this habit today`,
          'HABIT_MAX_COMPLETIONS_REACHED',
        );
      }

      const newCount       = body.status === 'completed' ? currentCount + 1 : currentCount;
      const resolvedStatus = (body.status === 'completed' && newCount >= timesPerDay
        ? 'completed'
        : body.status) as HabitLogStatus;

      const upserted = await tx.habitLog.upsert({
        where:  { habitId_logDate: { habitId: id, logDate } },
        create: {
          habitId:         id,
          userId:          req.user!.id,
          logDate,
          status:          resolvedStatus,
          completionCount: newCount,
          ...(body.value             !== undefined ? { value:             body.value             } : {}),
          ...(body.note              !== undefined ? { note:              body.note              } : {}),
          ...(body.skipReason        !== undefined ? { skipReason:        body.skipReason        } : {}),
          ...(body.customFieldValues !== undefined ? { customFieldValues: body.customFieldValues as Prisma.InputJsonValue } : {}),
        },
        update: {
          status:          resolvedStatus,
          completionCount: newCount,
          loggedAt:        new Date(),
          ...(body.value             !== undefined ? { value:             body.value             } : {}),
          ...(body.note              !== undefined ? { note:              body.note              } : {}),
          ...(body.skipReason        !== undefined ? { skipReason:        body.skipReason        } : {}),
          ...(body.customFieldValues !== undefined ? { customFieldValues: body.customFieldValues as Prisma.InputJsonValue } : {}),
        },
      });

      const wasAlreadyCompleted = existingLog?.status === 'completed';
      if (resolvedStatus === 'completed' && !wasAlreadyCompleted) {
        // Correct streak calculation: only continue if last completion was yesterday
        const lastCompleted = habit.lastCompletedDate;
        const yesterday     = new Date(logDate);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const lastStr      = lastCompleted ? new Date(lastCompleted).toISOString().slice(0, 10) : null;
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const logDateStr   = logDate.toISOString().slice(0, 10);

        let newStreak: number;
        if (!lastStr) {
          newStreak = 1; // First ever completion
        } else if (lastStr === logDateStr) {
          newStreak = habit.currentStreak; // Already counted today (defensive)
        } else if (lastStr === yesterdayStr) {
          newStreak = habit.currentStreak + 1; // Consecutive day
        } else {
          newStreak = 1; // Streak broken — gap in completions
        }

        await tx.habit.update({
          where: { id },
          data: {
            totalCompletions:  { increment: 1 },
            currentStreak:     newStreak,
            longestStreak:     Math.max(newStreak, habit.longestStreak),
            lastCompletedDate: logDate,
          },
        });
      }

      return { log: upserted, completionCount: newCount };
    });

    sendCreated(res, { ...result.log, timesPerDay, completionCount: result.completionCount });
  } catch (err) {
    next(err);
  }
}

export async function updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, date } = req.params as { id: string; date: string };
    const body    = req.body as UpdateLogInput;
    const logDate = new Date(date);

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const existing = await habitRepo.findLog(id, logDate);
    if (!existing) throw AppError.notFound('Habit log');

    const updated = await habitRepo.updateLog(id, logDate, {
      ...(body.status            !== undefined ? { status:            body.status as HabitLogStatus } : {}),
      ...(body.value             !== undefined ? { value:             body.value             } : {}),
      ...(body.note              !== undefined ? { note:              body.note              } : {}),
      ...(body.skipReason        !== undefined ? { skipReason:        body.skipReason        } : {}),
      ...(body.customFieldValues !== undefined ? { customFieldValues: body.customFieldValues } : {}),
    });

    // Recalculate from DB whenever status changes — accurate across all historical edits
    const prevCompleted = existing.status === 'completed';
    const nowCompleted  = (body.status ?? existing.status) === 'completed';
    if (body.status !== undefined && prevCompleted !== nowCompleted) {
      const streak = await recalculateHabitStreak(id);
      await prisma.habit.update({
        where: { id },
        data: {
          totalCompletions:  streak.totalCompletions,
          currentStreak:     streak.currentStreak,
          longestStreak:     streak.longestStreak,
          lastCompletedDate: streak.lastCompletedDate,
        },
      });
    }

    sendSuccess(res, updated);
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

    // Recalculate from remaining logs — accurate for streak and total completions
    if (log.status === 'completed') {
      const streak = await recalculateHabitStreak(id);
      await prisma.habit.update({
        where: { id },
        data: {
          totalCompletions:  streak.totalCompletions,
          currentStreak:     streak.currentStreak,
          longestStreak:     streak.longestStreak,
          lastCompletedDate: streak.lastCompletedDate,
        },
      });
    }

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

    const now  = new Date();
    const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const to   = query.to   ? new Date(query.to)   : now;

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        logDate: { gte: from, lte: to },
        ...(query.status ? { status: query.status as HabitLogStatus } : {}),
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

export async function getHabitStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitRepo.findById(id, req.user!.id);
    if (!habit) throw AppError.notFound('Habit');

    const now    = new Date();
    const from90 = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const from30 = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const from7  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const [allLogs, last30Logs, last7Logs] = await Promise.all([
      prisma.habitLog.findMany({
        where:   { habitId: id, logDate: { gte: from90 } },
        orderBy: { logDate: 'desc' },
        select:  { logDate: true, status: true, value: true, note: true, completionCount: true, customFieldValues: true },
      }),
      prisma.habitLog.findMany({
        where: { habitId: id, logDate: { gte: from30 }, status: 'completed' },
        select: { logDate: true },
      }),
      prisma.habitLog.findMany({
        where: { habitId: id, logDate: { gte: from7 }, status: 'completed' },
        select: { logDate: true },
      }),
    ]);

    const completedCount = allLogs.filter(l => l.status === 'completed').length;
    const totalDays      = allLogs.length;

    const heatmap = allLogs.map(l => ({
      date:              l.logDate.toISOString().split('T')[0],
      status:            l.status,
      value:             l.value ? Number(l.value) : null,
      note:              l.note,
      completionCount:   l.completionCount,
      customFieldValues: (l.customFieldValues ?? {}) as Record<string, unknown>,
    }));

    const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const dayLogs = allLogs.filter(l => new Date(l.logDate).getDay() === day);
      const count   = dayLogs.filter(l => l.status === 'completed').length;
      return { day, count, rate: dayLogs.length > 0 ? Math.round((count / dayLogs.length) * 100) : 0 };
    });

    sendSuccess(res, {
      habitId:            id,
      title:              habit.title,
      currentStreak:      habit.currentStreak,
      longestStreak:      habit.longestStreak,
      totalCompletions:   habit.totalCompletions,
      successRate:        totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0,
      last30Days:         last30Logs.length,
      last7Days:          last7Logs.length,
      heatmap,
      byDayOfWeek,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTodayHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now   = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const habits = await habitRepo.getTodayHabits(req.user!.id, today);

    // Attach timesPerDay to each habit
    const enriched = habits.map(h => ({
      ...h,
      timesPerDay: getTimesPerDay(h.frequencyConfig as Record<string, unknown>),
      todayLog: (h as { logs?: unknown[] }).logs?.[0] ?? null,
    }));

    sendSuccess(res, enriched);
  } catch (err) {
    next(err);
  }
}
