import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { toDateString } from '../utils/date';

/**
 * Aggregates yesterday's activity per user into daily_snapshots.
 * Runs every 6 hours; upserts so re-runs are safe.
 */
export async function dailySnapshotJob(): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const dateStr = toDateString(yesterday);

  // Get all users who had any activity yesterday
  const activeUsers = await prisma.user.findMany({
    where: { status: 'active', deletedAt: null },
    select: { id: true },
  });

  let processed = 0;

  for (const user of activeUsers) {
    try {
      const [habitLogs, journalEntries, workoutSessions, notes, plannerTasks] =
        await Promise.all([
          prisma.habitLog.findMany({
            where: { userId: user.id, logDate: yesterday },
          }),
          prisma.journalEntry.findMany({
            where: { userId: user.id, entryDate: yesterday, deletedAt: null },
          }),
          prisma.workoutSession.findMany({
            where: {
              userId: user.id,
              status: 'completed',
              startedAt: { gte: yesterday, lt: new Date(yesterday.getTime() + 86400000) },
            },
          }),
          prisma.note.count({
            where: {
              userId: user.id,
              deletedAt: null,
              createdAt: { gte: yesterday, lt: new Date(yesterday.getTime() + 86400000) },
            },
          }),
          prisma.plannerTask.findMany({
            where: { userId: user.id, planDate: yesterday },
          }),
        ]);

      const completed = habitLogs.filter(l => l.status === 'completed').length;
      const skipped = habitLogs.filter(l => l.status === 'skipped').length;
      const total = habitLogs.length;
      const completionPct = total > 0 ? (completed / total) * 100 : 0;

      const morningEntry = journalEntries.find(e => e.entryType === 'morning');
      const eveningEntry = journalEntries.find(e => e.entryType === 'evening');

      const totalVolumeKg = workoutSessions.reduce(
        (sum, s) => sum + Number(s.totalVolumeKg ?? 0),
        0,
      );

      await prisma.dailySnapshot.upsert({
        where: { userId_snapshotDate: { userId: user.id, snapshotDate: yesterday } },
        create: {
          userId: user.id,
          snapshotDate: yesterday,
          habitsScheduled: total,
          habitsCompleted: completed,
          habitsSkipped: skipped,
          habitCompletionPct: completionPct,
          moodMorning: morningEntry?.moodMorning ?? null,
          moodEvening: eveningEntry?.moodEvening ?? null,
          energyLevel: morningEntry?.energyLevel ?? null,
          stressLevel: eveningEntry?.stressLevel ?? null,
          sleepQuality: morningEntry?.sleepQuality ?? null,
          sleepHours: morningEntry?.sleepHours ?? null,
          workoutCount: workoutSessions.length,
          workoutVolumeKg: totalVolumeKg,
          journalWritten: journalEntries.length > 0,
          notesCreated: notes,
          tasksScheduled: plannerTasks.length,
          tasksCompleted: plannerTasks.filter(t => t.isCompleted).length,
        },
        update: {
          habitsScheduled: total,
          habitsCompleted: completed,
          habitsSkipped: skipped,
          habitCompletionPct: completionPct,
          workoutCount: workoutSessions.length,
          workoutVolumeKg: totalVolumeKg,
          journalWritten: journalEntries.length > 0,
          notesCreated: notes,
          tasksScheduled: plannerTasks.length,
          tasksCompleted: plannerTasks.filter(t => t.isCompleted).length,
        },
      });

      processed++;
    } catch (err) {
      logger.error('Daily snapshot failed for user', { userId: user.id, date: dateStr, err });
    }
  }

  logger.info('Daily snapshot job complete', { date: dateStr, usersProcessed: processed });
}
