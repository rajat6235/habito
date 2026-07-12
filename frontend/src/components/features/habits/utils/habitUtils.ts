import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

export function getTimesPerDay(habit: Habit): number {
  const cfg = habit.frequencyConfig as Record<string, unknown>;
  if (!cfg) return 1;
  const type = cfg['type'];
  if (type === 'custom_daily' && typeof cfg['timesPerDay'] === 'number') return cfg['timesPerDay'] as number;
  if (type === 'twice_daily') return 2;
  return 1;
}

export function isCompleted(habit: Habit): boolean {
  const h = habit as HabitWithTodayLog;
  if (!h.todayLog) return false;
  const timesPerDay = getTimesPerDay(habit);
  if (timesPerDay > 1) return (h.todayLog.completionCount ?? 0) >= timesPerDay;
  return h.todayLog.status === 'completed';
}

export function statusColor(status: string): string {
  if (status === 'completed') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'skipped')   return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function statusBg(status: string): string {
  if (status === 'completed') return 'bg-emerald-500';
  if (status === 'skipped')   return 'bg-amber-400';
  return 'bg-rose-400';
}
