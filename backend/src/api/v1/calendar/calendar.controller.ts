import { Request, Response, NextFunction } from 'express';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { prisma } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import type { CalendarDaysQuery } from './calendar.validation';
import type { CalendarDay } from '@shared/types/api.types';

// ── Real-time aggregation for today (cron hasn't run yet) ─────────────────────

async function buildRealTimeDay(userId: string, date: Date): Promise<CalendarDay> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const target  = parseISO(dateStr);

  const [habitLogs, journalEntries, plannerTasks] = await Promise.all([
    prisma.habitLog.findMany({
      where:  { userId, logDate: target },
      select: { status: true },
    }),
    prisma.journalEntry.findMany({
      where:  { userId, entryDate: target },
      select: { moodMorning: true, moodEvening: true },
    }),
    prisma.plannerTask.findMany({
      where:  { userId, planDate: target },
      select: { isCompleted: true },
    }),
  ]);

  const habitsScheduled    = habitLogs.length;
  const habitsCompleted    = habitLogs.filter((l) => l.status === 'completed').length;
  const habitCompletionPct = habitsScheduled > 0
    ? Math.round((habitsCompleted / habitsScheduled) * 100)
    : 0;

  const morningEntry = journalEntries.find((e) => e.moodMorning != null);
  const eveningEntry = journalEntries.find((e) => e.moodEvening != null);

  return {
    date:               dateStr,
    habitsCompleted,
    habitsScheduled,
    habitCompletionPct,
    moodMorning:        morningEntry?.moodMorning ?? null,
    moodEvening:        eveningEntry?.moodEvening ?? null,
    journalWritten:     journalEntries.length > 0,
    tasksCompleted:     plannerTasks.filter((t) => t.isCompleted).length,
    tasksScheduled:     plannerTasks.length,
    workoutCount:       0,
    recoveryDays:       0,
    notesCreated:       0,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function getCalendarDays(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as unknown as CalendarDaysQuery;
    const userId = req.user!.id;

    const fromDate = parseISO(from);
    const toDate   = parseISO(to);
    const today    = format(new Date(), 'yyyy-MM-dd');

    // Query DailySnapshot for the whole range in one shot
    const snapshots = await prisma.dailySnapshot.findMany({
      where: {
        userId,
        snapshotDate: { gte: fromDate, lte: toDate },
      },
    });

    const snapMap = new Map(
      snapshots.map((s) => [format(s.snapshotDate, 'yyyy-MM-dd'), s]),
    );

    // Build a CalendarDay for every day in range
    const days = eachDayOfInterval({ start: fromDate, end: toDate });

    const results: CalendarDay[] = await Promise.all(
      days.map(async (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Today: live query (snapshot hasn't been written yet)
        if (dateStr === today) {
          return buildRealTimeDay(userId, date);
        }

        const snap = snapMap.get(dateStr);
        return {
          date:               dateStr,
          habitsCompleted:    snap?.habitsCompleted    ?? 0,
          habitsScheduled:    snap?.habitsScheduled    ?? 0,
          habitCompletionPct: snap ? Number(snap.habitCompletionPct) : 0,
          moodMorning:        snap?.moodMorning        ?? null,
          moodEvening:        snap?.moodEvening        ?? null,
          journalWritten:     snap?.journalWritten     ?? false,
          tasksCompleted:     snap?.tasksCompleted     ?? 0,
          tasksScheduled:     snap?.tasksScheduled     ?? 0,
          workoutCount:       snap?.workoutCount       ?? 0,
          recoveryDays:       snap?.recoveryDays       ?? 0,
          notesCreated:       snap?.notesCreated       ?? 0,
        };
      }),
    );

    return sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}
