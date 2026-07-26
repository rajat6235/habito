import { prisma } from '../config/database';
import { logger } from '../config/logger';
import type { Prisma } from '@prisma/client';

function localDateString(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function isHabitDue(frequencyConfig: Prisma.JsonValue, date: Date): boolean {
  const cfg  = frequencyConfig as Record<string, unknown> | null;
  const type = cfg?.['type'];

  if (type === 'weekly') {
    const days = (cfg?.['days'] as number[] | undefined) ?? [];
    return days.includes(date.getUTCDay());
  }
  if (type === 'monthly') {
    const dates = (cfg?.['dates'] as number[] | undefined) ?? [];
    return dates.includes(date.getUTCDate());
  }
  // daily, twice_daily, custom_daily, quantity, time_based, every_x_hours — due every day
  return true;
}

/**
 * For each user, once their local "yesterday" has fully elapsed, marks any
 * due habit with no log for that date as 'skipped'. Runs hourly so it picks
 * up each user's local midnight without needing per-user schedulers.
 */
export async function autoSkipJob(): Promise<void> {
  const users = await prisma.user.findMany({
    where:  { deletedAt: null },
    select: { id: true, timezone: true },
  });

  let created = 0;

  for (const user of users) {
    const todayStr     = localDateString(new Date(), user.timezone || 'UTC');
    const yesterday     = new Date(`${todayStr}T00:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const habits = await prisma.habit.findMany({
      where: {
        userId:     user.id,
        deletedAt:  null,
        isArchived: false,
        startDate:  { lte: yesterday },
        OR: [{ endDate: null }, { endDate: { gte: yesterday } }],
      },
      select: { id: true, frequencyConfig: true },
    });

    const dueHabitIds = habits
      .filter(h => isHabitDue(h.frequencyConfig, yesterday))
      .map(h => h.id);
    if (dueHabitIds.length === 0) continue;

    const existingLogs = await prisma.habitLog.findMany({
      where:  { habitId: { in: dueHabitIds }, logDate: yesterday },
      select: { habitId: true },
    });
    const loggedIds = new Set(existingLogs.map(l => l.habitId));
    const toSkip     = dueHabitIds.filter(id => !loggedIds.has(id));
    if (toSkip.length === 0) continue;

    const result = await prisma.habitLog.createMany({
      data: toSkip.map(habitId => ({
        habitId,
        userId:          user.id,
        logDate:         yesterday,
        status:          'skipped' as const,
        skipReason:      'Not logged',
        completionCount: 0,
      })),
      skipDuplicates: true,
    });

    created += result.count;
  }

  logger.info('Auto-skip complete', { logsCreated: created });
}
