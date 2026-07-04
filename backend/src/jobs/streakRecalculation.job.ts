import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Recalculates current streak for all habits where last_completed_date
 * is more than 1 day ago — meaning the streak should be reset to 0.
 * The DB trigger handles increment; this job handles the reset.
 */
export async function streakRecalculationJob(): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const result = await prisma.habit.updateMany({
    where: {
      deletedAt: null,
      isArchived: false,
      currentStreak: { gt: 0 },
      lastCompletedDate: { lt: yesterday },
    },
    data: { currentStreak: 0 },
  });

  logger.info('Streak recalculation complete', { habitsReset: result.count });
}
