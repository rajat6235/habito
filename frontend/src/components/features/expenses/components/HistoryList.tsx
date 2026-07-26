'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { useExpenses } from '@/hooks/api/useExpenses';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@shared/types/api.types';

interface HistoryListProps {
  onEdit:   (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function groupByMonth(expenses: Expense[]): { label: string; expenses: Expense[] }[] {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const key = format(parseISO(expense.date), 'MMMM yyyy');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(expense);
  }
  return Array.from(groups.entries()).map(([label, expenses]) => ({ label, expenses }));
}

export function HistoryList({ onEdit, onDelete }: HistoryListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useExpenses();

  const allExpenses = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const months = useMemo(() => groupByMonth(allExpenses), [allExpenses]);

  if (isLoading) {
    return (
      <div className="space-y-2.5" aria-busy="true" aria-label="Loading expenses">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (allExpenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        title="No expenses logged yet"
        description="Log your first expense to start tracking."
        className="py-10 rounded-xl border border-border bg-muted/20"
      />
    );
  }

  return (
    <div className="space-y-4">
      {months.map(({ label, expenses }) => (
        <div key={label}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {label} · {expenses.length}
          </p>
          <div className="space-y-2">
            {expenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card"
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{
                    backgroundColor: expense.category.color ? `${expense.category.color}20` : undefined,
                    color: expense.category.color ?? undefined,
                  }}
                  aria-hidden
                >
                  {expense.category.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {expense.title || expense.category.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(expense.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{expense.category.name}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(expense.date), 'EEE, MMM d')}
                    </span>
                  </div>
                  {expense.items.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {expense.items.map(i => i.name).join(', ')}
                    </p>
                  )}
                  {expense.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{expense.note}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Edit ${expense.title || expense.category.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(expense)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Delete ${expense.title || expense.category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {hasNextPage && (
        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
