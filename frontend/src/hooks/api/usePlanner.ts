'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '@/lib/api/planner.api';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/lib/api/planner.api';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/stores/ui.store';

export function usePlannerTasks(date: string) {
  return useQuery({
    queryKey: queryKeys.planner.day(date),
    queryFn:  () => plannerApi.listByDate(date),
    staleTime: 30_000,
    enabled:  Boolean(date),
  });
}

export function useCreateTask() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => plannerApi.create(payload),
    onSuccess:  (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.planner.day(task.date) });
    },
    onError: (error) => {
      toast({ title: 'Failed to add task', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateTask(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      plannerApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.planner.day(date) });
    },
  });
}

export function useDeleteTask(date: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => plannerApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.planner.day(date) });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete task', description: String(error), variant: 'destructive' });
    },
  });
}

export function useCarryOverTasks(date: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ fromDate, toDate }: { fromDate: string; toDate: string }) =>
      plannerApi.carryOver(fromDate, toDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.planner.day(date) });
      toast({ title: 'Tasks carried over', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Carry-over failed', description: String(error), variant: 'destructive' });
    },
  });
}
