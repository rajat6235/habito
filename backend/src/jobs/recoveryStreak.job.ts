import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Recomputes current_streak_days for all active recovery goals so the sobriety clock stays
 * accurate hour to hour. Mirrors getSobrietyClock's base-date logic exactly: the streak runs
 * from the most recent relapse, or from the goal's start_date if there's never been one.
 * start_date itself is never touched here — it's the immutable "recovery began on" anchor
 * used by the history timeline/calendar and must only ever change via an explicit user edit.
 */
export async function recoveryStreakJob(): Promise<void> {
  const activeGoals = await prisma.recoveryGoal.findMany({
    where:  { status: 'active', deletedAt: null },
    select: { id: true, startDate: true, longestStreakDays: true },
  });

  let updated = 0;

  for (const goal of activeGoals) {
    const latestRelapse = await prisma.relapseLog.findFirst({
      where:   { recoveryGoalId: goal.id },
      orderBy: { relapsedAt: 'desc' },
      select:  { relapsedAt: true },
    });

    const baseDate  = latestRelapse?.relapsedAt ?? goal.startDate;
    const diffMs    = Date.now() - baseDate.getTime();
    const diffDays  = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    await prisma.recoveryGoal.update({
      where: { id: goal.id },
      data: {
        currentStreakDays: diffDays,
        longestStreakDays: Math.max(goal.longestStreakDays, diffDays),
      },
    });

    updated++;
  }

  logger.info('Recovery streak update complete', { goalsUpdated: updated });
}
