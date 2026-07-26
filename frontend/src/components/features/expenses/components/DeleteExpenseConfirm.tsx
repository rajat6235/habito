'use client';

import { format, parseISO } from 'date-fns';
import { useDeleteExpense } from '@/hooks/api/useExpenses';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Expense } from '@shared/types/api.types';

interface DeleteExpenseConfirmProps {
  expense: Expense | null;
  onClose: () => void;
}

export function DeleteExpenseConfirm({ expense, onClose }: DeleteExpenseConfirmProps) {
  const deleteExpense = useDeleteExpense();

  function confirm() {
    if (!expense) return;
    deleteExpense.mutate(expense.id, { onSuccess: onClose });
  }

  return (
    <Dialog open={Boolean(expense)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete expense</DialogTitle>
          <DialogDescription>
            Remove {expense?.title || expense?.category.name} from{' '}
            {expense && format(parseISO(expense.date), 'MMM d, yyyy')}? This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" loading={deleteExpense.isPending} onClick={confirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
