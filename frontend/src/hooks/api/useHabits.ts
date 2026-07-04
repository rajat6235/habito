'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { habitsApi, CreateHabitPayload, LogHabitPayload } from '@/lib/api/habits.api';
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

export function useHabitStats(id: string, period?: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: queryKeys.habits.stats(id, period),
    queryFn:  () => habitsApi.getStats(id, period),
    enabled:  Boolean(id),
    staleTime: 5 * 60_000,
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
  const qc      = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LogHabitPayload }) =>
      habitsApi.log(id, payload),
    onSuccess: (_, { payload }) => {
      const dateStr = payload.date;
      qc.invalidateQueries({ queryKey: queryKeys.habits.today(dateStr) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useHabitCategories() {
  return useQuery({
    queryKey: queryKeys.habits.categories(),
    queryFn:  habitsApi.getCategories,
    staleTime: 10 * 60_000,
  });
}
