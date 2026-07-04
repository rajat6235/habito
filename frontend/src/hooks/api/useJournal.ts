'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi, CreateJournalEntryPayload } from '@/lib/api/journal.api';
import { useToast } from '@/stores/ui.store';
import { format } from 'date-fns';

const KEYS = {
  all:    () => ['journal'] as const,
  byDate: (date: string) => ['journal', 'date', date] as const,
  detail: (id: string)   => ['journal', 'entry', id] as const,
};

export function useJournalByDate(date?: Date) {
  const dateStr = format(date ?? new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: KEYS.byDate(dateStr),
    queryFn:  () => journalApi.getByDate(dateStr),
    staleTime: 60_000,
  });
}

export function useCreateJournalEntry() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => journalApi.create(payload),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: KEYS.byDate(entry.entryDate) });
      qc.invalidateQueries({ queryKey: KEYS.all() });
      toast({ title: 'Entry saved', variant: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Failed to save entry', description: String(err), variant: 'destructive' });
    },
  });
}

export function useUpdateJournalEntry(id: string) {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: Partial<CreateJournalEntryPayload>) => journalApi.update(id, payload),
    onSuccess: (entry) => {
      qc.setQueryData(KEYS.detail(id), entry);
      qc.invalidateQueries({ queryKey: KEYS.byDate(entry.entryDate) });
      toast({ title: 'Entry updated', variant: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Failed to update entry', description: String(err), variant: 'destructive' });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      toast({ title: 'Entry deleted', variant: 'default' });
    },
  });
}
