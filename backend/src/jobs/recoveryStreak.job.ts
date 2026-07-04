import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Updates current_streak_days for all active recovery goals.
 * Runs hourly so the sobriety clock stays accurate.
 */
export async function recoveryStreakJob(): Promise<void> {
  const activeGoals = await prisma.recoveryGoal.findMany({
    where: { status: 'active', deletedAt: null },
    select: { id: true, startDate: true },
  });

  let updated = 0;

  for (const goal of activeGoals) {
    const diffMs = Date.now() - goal.startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    await prisma.recoveryGoal.update({
      where: { id: goal.id },
      data: {
        currentStreakDays: diffDays,
        longestStreakDays: { set: diffDays },
      },
    });

    updated++;
  }

  logger.info('Recovery streak update complete', { goalsUpdated: updated });
}
