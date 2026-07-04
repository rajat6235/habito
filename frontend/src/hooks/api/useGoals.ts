'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/lib/api/goals.api';
import type { CreateGoalPayload, GoalListParams } from '@/lib/api/goals.api';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/stores/ui.store';

export function useGoals(params?: GoalListParams) {
  return useQuery({
    queryKey: queryKeys.goals.all(params as Record<string, unknown>),
    queryFn:  () => goalsApi.list(params),
    staleTime: 30_000,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn:  () => goalsApi.get(id),
    enabled:  Boolean(id),
  });
}

export function useCreateGoal() {
  const qc         = useQueryClient();
  const { toast }  = useToast();

  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => goalsApi.create(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Goal created!', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create goal', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateGoal(id: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: Partial<CreateGoalPayload>) => goalsApi.update(id, payload),
    onSuccess:  (updated) => {
      qc.setQueryData(queryKeys.goals.detail(id), updated);
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Goal updated', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Update failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteGoal() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Goal removed', variant: 'default' });
    },
  });
}

export function useUpdateGoalProgress(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (value: number) => goalsApi.updateProgress(id, value),
    onSuccess:  (updated) => {
      qc.setQueryData(queryKeys.goals.detail(id), updated);
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useCreateMilestone(goalId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => goalsApi.createMilestone(goalId, title),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useCompleteMilestone(goalId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => goalsApi.completeMilestone(goalId, milestoneId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteMilestone(goalId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => goalsApi.deleteMilestone(goalId, milestoneId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
