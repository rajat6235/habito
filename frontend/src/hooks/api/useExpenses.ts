'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expensesApi, CreateExpensePayload, CreateExpenseCategoryPayload } from '@/lib/api/expenses.api';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/stores/ui.store';

export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenses.categories(),
    queryFn:  expensesApi.getCategories,
    staleTime: 10 * 60_000,
  });
}

export function useCreateExpenseCategory() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryPayload) => expensesApi.createCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories() });
      toast({ title: 'Category added', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add category', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateExpenseCategory() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateExpenseCategoryPayload> }) =>
      expensesApi.updateCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories() });
      toast({ title: 'Category updated', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update category', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteExpenseCategory() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.categories() });
      toast({ title: 'Category deleted', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete category', description: String(error), variant: 'destructive' });
    },
  });
}

export function useExpenseSummary() {
  return useQuery({
    queryKey: queryKeys.expenses.summary(),
    queryFn:  expensesApi.getSummary,
    staleTime: 30_000,
  });
}

export function useExpenses(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey:         queryKeys.expenses.all(filters),
    queryFn:          ({ pageParam }) => expensesApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.nextCursor ?? undefined : undefined,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn:  () => expensesApi.get(id),
    enabled:  Boolean(id),
  });
}

function invalidateExpenses(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['expenses'] });
}

export function useCreateExpense() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.create(payload),
    onSuccess: () => {
      invalidateExpenses(qc);
      toast({ title: 'Expense logged', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to log expense', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateExpense(id: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: Partial<CreateExpensePayload>) => expensesApi.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.expenses.detail(id), updated);
      invalidateExpenses(qc);
      toast({ title: 'Expense updated', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update expense', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteExpense() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      invalidateExpenses(qc);
      toast({ title: 'Expense deleted', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete expense', description: String(error), variant: 'destructive' });
    },
  });
}
