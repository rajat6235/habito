'use client';

import { format, parseISO } from 'date-fns';
import { useDeleteLog } from '@/hooks/api/useHabits';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { HabitLog } from '@shared/types/api.types';

interface DeleteLogConfirmProps {
  log:     HabitLog | null;
  habitId: string;
  onClose: () => void;
}

export function DeleteLogConfirm({ log, habitId, onClose }: DeleteLogConfirmProps) {
  const deleteLog = useDeleteLog(habitId);

  function confirm() {
    if (!log) return;
    deleteLog.mutate(log.logDate, { onSuccess: onClose });
  }

  return (
    <Dialog open={Boolean(log)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete log</DialogTitle>
          <DialogDescription>
            Remove the log for {log && format(parseISO(log.logDate), 'MMM d, yyyy')}? This will recalculate your streak.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" loading={deleteLog.isPending} onClick={confirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
