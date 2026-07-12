'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { calendarApi } from '@/lib/api/calendar.api';

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
