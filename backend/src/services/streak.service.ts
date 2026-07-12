import { prisma } from '../config/database';

export interface StreakResult {
  currentStreak:     number;
  longestStreak:     number;
  lastCompletedDate: Date | null;
  totalCompletions:  number;
}

/**
 * Computes streak stats from an ordered list of completion dates.
 * Pure function — no DB access, fully unit-testable.
 *
 * Dates should be sorted ascending. Duplicates (same calendar day) are ignored.
 * "current" streak is live only if the most recent completion was today or yesterday (UTC).
 */
export function computeStreakFromDates(rawDates: Date[]): Omit<StreakResult, 'totalCompletions'> {
  if (rawDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  // Sort ascending and deduplicate by calendar day
  const sorted = [...rawDates].sort((a, b) => a.getTime() - b.getTime());
  const unique: Date[] = [];
  for (const d of sorted) {
    const s = d.toISOString().slice(0, 10);
    if (unique.length === 0 || s !== unique[unique.length - 1]!.toISOString().slice(0, 10)) {
      unique.push(d);
    }
  }

  // Longest streak: scan forward, count consecutive day pairs
  let longestStreak = 1;
  let run           = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]!);
    prev.setUTCDate(prev.getUTCDate() + 1);
    if (prev.toISOString().slice(0, 10) === unique[i]!.toISOString().slice(0, 10)) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  const lastDate    = unique[unique.length - 1]!;
  const lastDateStr = lastDate.toISOString().slice(0, 10);
  const now         = new Date();
  const todayStr    = now.toISOString().slice(0, 10);
  const yesterday   = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Streak is dead if last completion was more than 1 day ago
  if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
    return { currentStreak: 0, longestStreak, lastCompletedDate: lastDate };
  }

  // Walk backwards from the last entry counting consecutive days
  let currentStreak = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    const next     = new Date(unique[i + 1]!);
    next.setUTCDate(next.getUTCDate() - 1);
    if (unique[i]!.toISOString().slice(0, 10) === next.toISOString().slice(0, 10)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak, lastCompletedDate: lastDate };
}

/**
 * Reads all completed logs for a habit from the database and recomputes
 * streak stats from scratch.
 *
 * Call this after any log mutation that could affect streak accuracy
 * (status change on edit, deletion of a completed log).
 */
export async function recalculateHabitStreak(habitId: string): Promise<StreakResult> {
  const logs = await prisma.habitLog.findMany({
    where:   { habitId, status: 'completed' },
    orderBy: { logDate: 'asc' },
    select:  { logDate: true },
  });

  const dates  = logs.map(l => new Date(l.logDate));
  const streak = computeStreakFromDates(dates);

  return { ...streak, totalCompletions: logs.length };
}
