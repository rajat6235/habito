import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

export function getTimesPerDay(habit: Habit): number {
  const cfg = habit.frequencyConfig as Record<string, unknown>;
  if (!cfg) return 1;
  const type = cfg['type'];
  if (type === 'custom_daily' && typeof cfg['timesPerDay'] === 'number') return cfg['timesPerDay'] as number;
  if (type === 'twice_daily') return 2;
  return 1;
}

// Completions needed for the day to count as done. Defaults to timesPerDay
// (every completion required) unless the habit sets a lower threshold.
export function getMinRequired(habit: Habit): number {
  const cfg = habit.frequencyConfig as Record<string, unknown>;
  const timesPerDay = getTimesPerDay(habit);
  const minRequired = cfg?.['minRequired'];
  return typeof minRequired === 'number' && minRequired >= 1 ? Math.min(minRequired, timesPerDay) : timesPerDay;
}

export function isCompleted(habit: Habit): boolean {
  const h = habit as HabitWithTodayLog;
  // The backend already gates status on minRequired (see logHabit) — trust it
  // directly rather than re-deriving completeness from completionCount here.
  return h.todayLog?.status === 'completed';
}

export function statusColor(status: string): string {
  if (status === 'completed') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'partial')   return 'text-sky-600 dark:text-sky-400';
  if (status === 'skipped')   return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function statusBg(status: string): string {
  if (status === 'completed') return 'bg-emerald-500';
  if (status === 'partial')   return 'bg-sky-400';
  if (status === 'skipped')   return 'bg-amber-400';
  return 'bg-rose-400';
}
