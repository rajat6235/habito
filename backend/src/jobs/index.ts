import { logger } from '../config/logger';

interface Job {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

const jobs: Job[] = [];
const timers: NodeJS.Timeout[] = [];

function registerJob(job: Job): void {
  jobs.push(job);
}

async function runJob(job: Job): Promise<void> {
  const start = Date.now();
  try {
    logger.info(`Job started: ${job.name}`);
    await job.run();
    logger.info(`Job completed: ${job.name}`, { durationMs: Date.now() - start });
  } catch (err) {
    logger.error(`Job failed: ${job.name}`, { err, durationMs: Date.now() - start });
  }
}

export function startJobs(): void {
  for (const job of jobs) {
    // Run once at startup, then on interval
    void runJob(job);
    const timer = setInterval(() => void runJob(job), job.intervalMs);
    timer.unref(); // Don't keep process alive for jobs alone
    timers.push(timer);
  }
  logger.info(`Started ${jobs.length} background jobs`);
}

export function stopJobs(): void {
  timers.forEach(clearInterval);
  timers.length = 0;
  logger.info('Background jobs stopped');
}

// ── Register all jobs ─────────────────────────────────────────────

import { tokenCleanupJob } from './tokenCleanup.job';
import { dailySnapshotJob } from './dailySnapshot.job';
import { streakRecalculationJob } from './streakRecalculation.job';
import { recoveryStreakJob } from './recoveryStreak.job';

registerJob({
  name: 'token-cleanup',
  intervalMs: 60 * 60 * 1000,          // hourly
  run: tokenCleanupJob,
});

registerJob({
  name: 'daily-snapshot',
  intervalMs: 6 * 60 * 60 * 1000,      // every 6 hours
  run: dailySnapshotJob,
});

registerJob({
  name: 'streak-recalculation',
  intervalMs: 24 * 60 * 60 * 1000,     // daily (midnight UTC)
  run: streakRecalculationJob,
});

registerJob({
  name: 'recovery-streak',
  intervalMs: 60 * 60 * 1000,          // hourly
  run: recoveryStreakJob,
});
