'use client';

import { format, parseISO } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { getCategoryIcon } from '../utils/categoryIcon';
import type { Expense } from '@shared/types/api.types';

interface ExpenseDetailDialogProps {
  expense:  Expense | null;
  onClose:  () => void;
  onEdit:   (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseDetailDialog({ expense, onClose, onEdit, onDelete }: ExpenseDetailDialogProps) {
  const CategoryIcon = getCategoryIcon(expense?.category.icon);

  return (
    <Dialog open={Boolean(expense)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: expense?.category.color ? `${expense.category.color}1a` : undefined,
                color: expense?.category.color ?? undefined,
              }}
              aria-hidden
            >
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">{expense?.title || expense?.category.name}</DialogTitle>
              <DialogDescription className="mt-0">
                {expense && `${expense.category.name} · ${format(parseISO(expense.date), 'EEEE, MMM d, yyyy')}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {expense && (
          <>
            <div className="space-y-1 rounded-xl border border-border divide-y divide-border overflow-hidden">
              {expense.items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.quantity !== null && (
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-muted/40">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold tabular-nums">{formatCurrency(expense.total)}</span>
              </div>
            </div>

            {expense.note && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note</p>
                <p className="text-sm text-foreground/90">{expense.note}</p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => { onDelete(expense); onClose(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button onClick={() => { onEdit(expense); onClose(); }}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
