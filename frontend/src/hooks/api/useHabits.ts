'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { habitsApi, CreateHabitPayload, LogHabitPayload, UpdateLogPayload } from '@/lib/api/habits.api';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/stores/ui.store';
import { format } from 'date-fns';

export function useTodayHabits(date?: Date) {
  const dateStr = format(date ?? new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: queryKeys.habits.today(dateStr),
    queryFn:  () => habitsApi.today(dateStr),
    staleTime: 30_000,
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: queryKeys.habits.detail(id),
    queryFn:  () => habitsApi.get(id),
    enabled:  Boolean(id),
  });
}

export function useHabits(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey:      queryKeys.habits.all(filters),
    queryFn:       ({ pageParam }) =>
      habitsApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
  });
}

export function useHabitStats(id: string) {
  return useQuery({
    queryKey: queryKeys.habits.stats(id),
    queryFn:  () => habitsApi.getStats(id),
    enabled:  Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreateHabit() {
  const qc      = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateHabitPayload) => habitsApi.create(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit created!', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create habit', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateHabit(id: string) {
  const qc      = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: Partial<CreateHabitPayload>) => habitsApi.update(id, payload),
    onSuccess:  (updated) => {
      qc.setQueryData(queryKeys.habits.detail(id), updated);
      qc.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit updated', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Update failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteHabit() {
  const qc      = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit deleted', variant: 'default' });
    },
  });
}

export function useLogHabit() {
  const qc         = useQueryClient();
  const { toast }  = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LogHabitPayload }) =>
      habitsApi.log(id, payload),
    onSuccess: (_, { payload }) => {
      const dateStr = payload.date;
      qc.invalidateQueries({ queryKey: queryKeys.habits.today(dateStr) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => {
      const msg = error.message.includes('HABIT_MAX_COMPLETIONS_REACHED')
        ? "You've already hit the daily limit for this habit."
        : error.message || 'Failed to log habit.';
      toast({ title: 'Could not log habit', description: msg, variant: 'destructive' });
    },
  });
}

export function useUpdateLog(habitId: string) {
  const qc      = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ date, payload }: { date: string; payload: UpdateLogPayload }) =>
      habitsApi.updateLog(habitId, date, payload),
    onSuccess: (_, { date }) => {
      qc.invalidateQueries({ queryKey: queryKeys.habits.today(date) });
      qc.invalidateQueries({ queryKey: queryKeys.habits.logs(habitId) });
      qc.invalidateQueries({ queryKey: queryKeys.habits.stats(habitId) });
      toast({ title: 'Log updated', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Update failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteLog(habitId: string) {
  const qc      = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (date: string) => habitsApi.deleteLog(habitId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits.today(format(new Date(), 'yyyy-MM-dd')) });
      qc.invalidateQueries({ queryKey: queryKeys.habits.logs(habitId) });
      qc.invalidateQueries({ queryKey: queryKeys.habits.stats(habitId) });
      toast({ title: 'Log deleted', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useHabitLogs(habitId: string, params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey:      queryKeys.habits.logs(habitId, params),
    queryFn:       ({ pageParam }) =>
      habitsApi.getLogs(habitId, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
    enabled: Boolean(habitId),
  });
}

// Lighter version for fixed date ranges (calendar view — no pagination needed)
export function useHabitLogsRange(habitId: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.habits.logs(habitId, { from, to, range: true }),
    queryFn:  () => habitsApi.getLogs(habitId, { from, to, limit: 31 }),
    enabled:  Boolean(habitId),
    staleTime: 60_000,
  });
}

export function useHabitCategories() {
  return useQuery({
    queryKey: queryKeys.habits.categories(),
    queryFn:  habitsApi.getCategories,
    staleTime: 10 * 60_000,
  });
}
