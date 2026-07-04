'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recoveryApi, CreateRecoveryGoalPayload, LogRelapsePayload } from '@/lib/api/recovery.api';
import { useToast } from '@/stores/ui.store';

const KEYS = {
  all:     () => ['recovery'] as const,
  detail:  (id: string) => ['recovery', id] as const,
  clock:   (id: string) => ['recovery', id, 'clock'] as const,
  relapses:(id: string) => ['recovery', id, 'relapses'] as const,
};

export function useRecoveryGoals() {
  return useQuery({
    queryKey: KEYS.all(),
    queryFn:  recoveryApi.list,
    staleTime: 30_000,
  });
}

export function useRecoveryGoal(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn:  () => recoveryApi.get(id),
    enabled:  Boolean(id),
  });
}

export function useSobrietyClock(id: string) {
  return useQuery({
    queryKey: KEYS.clock(id),
    queryFn:  () => recoveryApi.getClock(id),
    enabled:  Boolean(id),
    refetchInterval: 60_000,
  });
}

export function useRelapseHistory(id: string) {
  return useQuery({
    queryKey: KEYS.relapses(id),
    queryFn:  () => recoveryApi.getRelapses(id),
    enabled:  Boolean(id),
  });
}

export function useCreateRecoveryGoal() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateRecoveryGoalPayload) => recoveryApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      toast({ title: 'Recovery goal created', variant: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Failed to create goal', description: String(err), variant: 'destructive' });
    },
  });
}

export function useLogRelapse(goalId: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: LogRelapsePayload) => recoveryApi.logRelapse(goalId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(goalId) });
      qc.invalidateQueries({ queryKey: KEYS.clock(goalId) });
      qc.invalidateQueries({ queryKey: KEYS.relapses(goalId) });
      toast({ title: 'Relapse logged', description: 'Keep going — every moment is a fresh start.', variant: 'default' });
    },
  });
}

export function usePauseResumeGoal(goalId: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (pausing: boolean) =>
      pausing ? recoveryApi.pause(goalId) : recoveryApi.resume(goalId),
    onSuccess: (goal) => {
      qc.setQueryData(KEYS.detail(goalId), goal);
      qc.invalidateQueries({ queryKey: KEYS.all() });
      toast({
        title: goal.status === 'paused' ? 'Goal paused' : 'Goal resumed',
        variant: 'success',
      });
    },
  });
}
