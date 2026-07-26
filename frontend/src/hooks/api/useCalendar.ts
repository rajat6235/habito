'use client';

import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { calendarApi } from '@/lib/api/calendar.api';
import { recoveryApi } from '@/lib/api/recovery.api';
import { habitsApi } from '@/lib/api/habits.api';
import { expensesApi } from '@/lib/api/expenses.api';
import { useRecoveryGoals } from './useRecovery';
import { useHabits } from './useHabits';
import { buildStreakSegments, getRecoveryDayInfo } from '@/components/features/recovery/utils/timeline';
import { recoveryEvent, eventHabitEvent, expenseEvent, type DayEvent } from '@/components/features/calendar/dayEvents';

export function useCalendarDays(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar', 'range', from, to],
    queryFn:  () => calendarApi.getDays(from, to),
    staleTime: 60_000,
    enabled:   Boolean(from && to),
  });
}

export function useCalendarMonth(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const from = format(startOfMonth(date), 'yyyy-MM-dd');
  const to   = format(endOfMonth(date),   'yyyy-MM-dd');
  return useCalendarDays(from, to);
}

export function useCalendarHeatmap(daysBack = 91) {
  const to   = format(new Date(),              'yyyy-MM-dd');
  const from = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');
  return useCalendarDays(from, to);
}

// ── Extras: Recovery / Event-based habits / Expenses, merged per day ───────────
// These modules aren't part of the DailySnapshot rollup (see calendar.controller.ts),
// so they're composed client-side from their own existing endpoints/utils rather than
// growing the snapshot table for data that's cheap to fetch on demand.

export type RecoveryDotStatus = 'relapse' | 'milestone' | 'recovery';

export interface CalendarDayExtras {
  recoveryStatus:  RecoveryDotStatus | null;
  eventHabitCount: number;
  expensesTotal:   number;
  // Per-module DayEvents for whatever this hook already fetches per-day data for
  // (recovery, event-based habits, expenses). Combined with the habits/journal/
  // planner/notes fields already on CalendarDay, this is the full event pool a
  // day cell ranks its headline from — see dayEvents.ts.
  events: DayEvent[];
}

const RECOVERY_RANK: Record<RecoveryDotStatus, number> = { relapse: 3, milestone: 2, recovery: 1 };

export function useCalendarExtras(from: string, to: string) {
  const { data: goals = [] }          = useRecoveryGoals();
  const { data: eventHabitPages }     = useHabits({ habitType: 'event' });
  const eventHabits = useMemo(() => eventHabitPages?.pages.flatMap(p => p.data) ?? [], [eventHabitPages]);

  const relapseQueries = useQueries({
    queries: goals.map((goal) => ({
      queryKey: ['recovery', goal.id, 'relapses', 'calendar-extras'],
      queryFn:  () => recoveryApi.getRelapses(goal.id),
      staleTime: 30_000,
    })),
  });

  const eventLogQueries = useQueries({
    queries: eventHabits.map((habit) => ({
      queryKey: ['habits', habit.id, 'logs', 'calendar-extras', from, to],
      queryFn:  () => habitsApi.getLogs(habit.id, { from, to, limit: 100 }),
      staleTime: 60_000,
      enabled:   Boolean(from && to),
    })),
  });

  const { data: expensePages } = useQuery({
    queryKey: ['expenses', 'calendar-extras', from, to],
    queryFn:  () => expensesApi.list({ from, to, limit: 100 }),
    staleTime: 60_000,
    enabled:   Boolean(from && to),
  });

  const isLoading =
    relapseQueries.some(q => q.isLoading) || eventLogQueries.some(q => q.isLoading);

  const data = useMemo(() => {
    const map = new Map<string, CalendarDayExtras>();
    if (!from || !to) return map;
    const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
    for (const d of days) {
      map.set(format(d, 'yyyy-MM-dd'), { recoveryStatus: null, eventHabitCount: 0, expensesTotal: 0, events: [] });
    }

    goals.forEach((goal, i) => {
      const relapses = relapseQueries[i]?.data ?? [];
      const segments = buildStreakSegments(goal, relapses);
      for (const d of days) {
        const key   = format(d, 'yyyy-MM-dd');
        const entry = map.get(key);
        if (!entry) continue;
        const info = getRecoveryDayInfo(d, goal, segments);
        if (info.status === 'relapse' || info.status === 'milestone' || info.status === 'recovery') {
          if (!entry.recoveryStatus || RECOVERY_RANK[info.status] > RECOVERY_RANK[entry.recoveryStatus]) {
            entry.recoveryStatus = info.status;
            entry.events = entry.events.filter((e) => e.module !== 'recovery');
            entry.events.push(recoveryEvent(key, info.status, info.dayNumber));
          }
        }
      }
    });

    eventHabits.forEach((habit, i) => {
      const logs = eventLogQueries[i]?.data?.data ?? [];
      for (const log of logs) {
        if (log.status !== 'completed') continue;
        const key   = log.logDate.slice(0, 10);
        const entry = map.get(key);
        if (entry) {
          entry.eventHabitCount += 1;
          entry.events.push(eventHabitEvent(key, habit.id, habit.title, habit.icon, log.loggedAt ?? null));
        }
      }
    });

    for (const exp of expensePages?.data ?? []) {
      const entry = map.get(exp.date);
      if (entry) entry.expensesTotal += exp.total;
    }
    for (const [key, entry] of map) {
      if (entry.expensesTotal > 0) entry.events.push(expenseEvent(key, entry.expensesTotal));
    }

    return map;
  }, [from, to, goals, relapseQueries, eventHabits, eventLogQueries, expensePages]);

  return { data, isLoading };
}
