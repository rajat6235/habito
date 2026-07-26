'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useExpenseSummary } from '@/hooks/api/useExpenses';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ExpenseFormSheet } from './components/ExpenseFormSheet';
import { HistoryList } from './components/HistoryList';
import { DeleteExpenseConfirm } from './components/DeleteExpenseConfirm';
import type { Expense } from '@shared/types/api.types';

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

function SummaryCards() {
  const { data: summary, isLoading } = useExpenseSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const tiles = [
    { label: 'Today',      value: summary?.today     ?? 0 },
    { label: 'This week',  value: summary?.thisWeek  ?? 0 },
    { label: 'This month', value: summary?.thisMonth ?? 0 },
    { label: 'This year',  value: summary?.thisYear  ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiles.map(tile => (
        <div key={tile.label} className="text-center p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-xl font-bold tabular-nums">{formatCurrency(tile.value)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}

function CategoryBreakdown() {
  const { data: summary, isLoading } = useExpenseSummary();

  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!summary || summary.byCategory.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
      {summary.byCategory.map(cat => (
        <div key={cat.categoryId} className="flex items-center justify-between gap-3 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color ?? undefined }}
              aria-hidden
            />
            <span className="text-sm font-medium truncate">{cat.name}</span>
          </div>
          <span className="text-sm font-semibold tabular-nums shrink-0">{formatCurrency(cat.total)}</span>
        </div>
      ))}
    </div>
  );
}

export function ExpensesView() {
  const [formOpen,       setFormOpen]       = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  function openCreate() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingExpense(null);
  }

  return (
    <>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 pb-28 md:pb-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Expenses
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Spending</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track what you spend on your habits.</p>
          </div>
          <Button onClick={openCreate} size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <SummaryCards />
        </motion.div>

        <motion.div variants={fadeUp}>
          <CategoryBreakdown />
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <p className="text-sm font-semibold">History</p>
          <HistoryList onEdit={openEdit} onDelete={setDeletingExpense} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {formOpen && (
          <ExpenseFormSheet open={formOpen} expense={editingExpense} onClose={closeForm} />
        )}
        {deletingExpense && (
          <DeleteExpenseConfirm expense={deletingExpense} onClose={() => setDeletingExpense(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
