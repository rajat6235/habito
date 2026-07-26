'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Plus, TrendingUp, TrendingDown, Trophy, Receipt, X } from 'lucide-react';
import { useExpenseSummary } from '@/hooks/api/useExpenses';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { ExpenseFormSheet } from './components/ExpenseFormSheet';
import { HistoryList } from './components/HistoryList';
import { DeleteExpenseConfirm } from './components/DeleteExpenseConfirm';
import { ExpenseDetailDialog } from './components/ExpenseDetailDialog';
import { getCategoryIcon } from './utils/categoryIcon';
import type { Expense, ExpenseSummary } from '@shared/types/api.types';

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

// ── Hero + secondary stats ───────────────────────────────────────────────────

function WeekTrendBadge({ summary }: { summary: ExpenseSummary }) {
  if (summary.lastWeek === 0) {
    if (summary.thisWeek === 0) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
        New this week
      </span>
    );
  }
  const pct = summary.weekChangePct ?? 0;
  const isDown = pct <= 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
      isDown ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
             : 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    )}>
      {isDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {Math.abs(pct)}% vs last week
    </span>
  );
}

function HeroAndStats() {
  const { data: summary, isLoading } = useExpenseSummary();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }
  if (!summary) return null;

  const secondary = [
    { label: 'Today',      value: summary.today },
    { label: 'This month', value: summary.thisMonth },
    { label: 'This year',  value: summary.thisYear },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] to-transparent p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
          <WeekTrendBadge summary={summary} />
        </div>
        <p className="text-3xl font-bold tabular-nums tracking-tight">{formatCurrency(summary.thisWeek)}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {secondary.map(tile => (
          <div key={tile.label} className="text-center p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-lg font-bold tabular-nums">{formatCurrency(tile.value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Insight strip ────────────────────────────────────────────────────────────

function InsightStrip() {
  const { data: summary } = useExpenseSummary();
  if (!summary || summary.totalSessions === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-muted-foreground">
      {summary.largestSession && (
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          Largest session:{' '}
          <span className="font-medium text-foreground">{formatCurrency(summary.largestSession.amount)}</span>
          {' · '}{summary.largestSession.categoryName}
          {' · '}{format(parseISO(summary.largestSession.date), 'MMM d')}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Receipt className="h-3.5 w-3.5" aria-hidden />
        {summary.totalSessions} session{summary.totalSessions === 1 ? '' : 's'} logged
      </span>
    </div>
  );
}

// ── Category grid ─────────────────────────────────────────────────────────────

function CategoryGrid({ selected, onSelect }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const { data: summary, isLoading } = useExpenseSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }
  if (!summary || summary.byCategory.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {summary.byCategory.map(cat => {
        const CategoryIcon = getCategoryIcon(cat.icon);
        const isSelected = selected === cat.categoryId;
        return (
          <button
            key={cat.categoryId}
            type="button"
            onClick={() => onSelect(isSelected ? null : cat.categoryId)}
            className={cn(
              'text-left p-3.5 rounded-xl border bg-card transition-all hover:shadow-sm',
              isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: cat.color ? `${cat.color}1a` : undefined, color: cat.color ?? undefined }}
                aria-hidden
              >
                <CategoryIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium truncate">{cat.name}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(cat.total)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cat.sessionCount} session{cat.sessionCount === 1 ? '' : 's'} · avg {formatCurrency(cat.avgSession)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ExpensesView() {
  const [formOpen,        setFormOpen]        = useState(false);
  const [editingExpense,  setEditingExpense]  = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [viewingExpense,  setViewingExpense]  = useState<Expense | null>(null);
  const [categoryFilter,  setCategoryFilter]  = useState<string | null>(null);
  const { data: summary } = useExpenseSummary();

  const filteredCategoryName = summary?.byCategory.find(c => c.categoryId === categoryFilter)?.name;

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
          <HeroAndStats />
        </motion.div>

        <motion.div variants={fadeUp}>
          <InsightStrip />
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <p className="text-sm font-semibold">By category</p>
          <CategoryGrid selected={categoryFilter} onSelect={setCategoryFilter} />
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">History</p>
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {filteredCategoryName}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <HistoryList
            categoryId={categoryFilter}
            onView={setViewingExpense}
            onEdit={openEdit}
            onDelete={setDeletingExpense}
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {formOpen && (
          <ExpenseFormSheet open={formOpen} expense={editingExpense} onClose={closeForm} />
        )}
        {deletingExpense && (
          <DeleteExpenseConfirm expense={deletingExpense} onClose={() => setDeletingExpense(null)} />
        )}
        {viewingExpense && (
          <ExpenseDetailDialog
            expense={viewingExpense}
            onClose={() => setViewingExpense(null)}
            onEdit={openEdit}
            onDelete={setDeletingExpense}
          />
        )}
      </AnimatePresence>
    </>
  );
}
