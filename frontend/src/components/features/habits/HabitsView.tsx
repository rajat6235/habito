'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Sparkles } from 'lucide-react';

import { useTodayHabits, useLogHabit } from '@/hooks/api/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { HabitCard } from '@/components/shared/HabitCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { LogModal } from './components/LogModal';
import { HabitHistorySheet } from './components/HabitHistorySheet';
import { CreateHabitSheet } from './components/CreateHabitSheet';
import { DeleteHabitConfirm } from './components/DeleteHabitConfirm';
import { ProgressRing } from './components/ProgressRing';
import { isCompleted } from './utils/habitUtils';
import { FILTER_TABS, fadeUp, stagger, type FilterKey } from './habits.constants';

import type { Habit } from '@shared/types/api.types';

function getGreeting(hour: number): string {
  if (hour < 5)  return 'Still at it?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function motivationalCopy(pct: number, allDone: boolean): { headline: string; sub: string } {
  if (allDone) return {
    headline: 'Perfect day! 🎉',
    sub: 'Every habit done. Consistency compounds.',
  };
  if (pct === 0)  return { headline: 'Let\'s go', sub: 'One check at a time.' };
  if (pct < 33)   return { headline: 'Building momentum', sub: 'The hardest part is starting.' };
  if (pct < 66)   return { headline: 'Halfway there', sub: 'Keep going — the second half is easier.' };
  if (pct < 100)  return { headline: 'Almost there', sub: 'Finish strong.' };
  return { headline: 'All done', sub: 'Come back tomorrow.' };
}

export function HabitsView() {
  const today   = useMemo(() => new Date(), []);
  const dateStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [createOpen,   setCreateOpen]   = useState(false);
  const [logHabit,     setLogHabit]     = useState<Habit | null>(null);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);
  const [deleteHabit,  setDeleteHabit]  = useState<Habit | null>(null);

  const { data: todayHabits = [], isLoading, isError } = useTodayHabits(today);
  const logMutation = useLogHabit();

  const completed = todayHabits.filter(isCompleted).length;
  const total     = todayHabits.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone   = total > 0 && completed === total;
  const maxStreak = useMemo(
    () => todayHabits.reduce((m, h) => Math.max(m, h.currentStreak ?? 0), 0),
    [todayHabits],
  );
  const copy = useMemo(() => motivationalCopy(pct, allDone), [pct, allDone]);

  const greeting    = getGreeting(today.getHours());
  const displayName = user?.firstName ?? user?.username ?? '';

  const displayedHabits = useMemo(() => {
    if (activeFilter === 'done')    return todayHabits.filter(isCompleted);
    if (activeFilter === 'pending') return todayHabits.filter(h => !isCompleted(h));
    return todayHabits;
  }, [todayHabits, activeFilter]);

  const handleCheck = useCallback((habit: Habit, checked: boolean) => {
    logMutation.mutate({
      id:      habit.id,
      payload: { date: dateStr, status: checked ? 'completed' : 'skipped' },
    });
  }, [logMutation, dateStr]);

  const handleLog = useCallback((habit: Habit) => {
    setLogHabit(habit);
  }, []);

  return (
    <div className="relative min-h-full">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 lg:p-8 space-y-5 max-w-2xl mx-auto pb-28 md:pb-10"
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {format(today, 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}{displayName ? `, ${displayName}` : ''}
            </h1>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 hidden sm:flex"
            size="sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New habit
          </Button>
        </motion.div>

        {/* ── Progress card ── */}
        {!isLoading && total > 0 && (
          <motion.div
            variants={fadeUp}
            className={cn(
              'rounded-2xl border p-5 flex items-center gap-5 transition-all duration-500',
              allDone
                ? 'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07]'
                : 'border-border bg-card',
            )}
          >
            <ProgressRing
              percentage={pct}
              completed={completed}
              total={total}
              streak={maxStreak}
              size={104}
              strokeWidth={8}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-bold text-[17px] leading-snug">{copy.headline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{copy.sub}</p>
              {!allDone && total - completed > 0 && (
                <p className="text-xs text-muted-foreground/70 pt-1.5 tabular-nums">
                  {total - completed} of {total} remaining
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Filter tabs ── */}
        {!isLoading && total > 0 && (
          <motion.div
            variants={fadeUp}
            className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit"
            role="tablist"
            aria-label="Filter habits"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeFilter === tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  activeFilter === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.key === 'pending' && (total - completed) > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[9px] h-3.5 px-1 py-0">
                    {total - completed}
                  </Badge>
                )}
                {tab.key === 'done' && completed > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[9px] h-3.5 px-1 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    {completed}
                  </Badge>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Habit list ── */}
        {isLoading && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading habits">
            {[0.9, 0.7, 0.85, 0.75, 0.6].map((opacity, i) => (
              <Skeleton
                key={i}
                className="h-[62px] rounded-xl"
                style={{ opacity }}
              />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <EmptyState
            icon={<Sparkles />}
            title="Couldn't reach the server"
            description="Check your connection and try refreshing."
            className="py-12 rounded-2xl border border-border bg-muted/20"
          />
        )}

        {!isLoading && !isError && displayedHabits.length === 0 && (
          <EmptyState
            icon={<Sparkles />}
            title={
              activeFilter === 'all'
                ? 'Start your first habit'
                : activeFilter === 'pending'
                  ? 'All done for today 🎉'
                  : 'No completed habits yet'
            }
            description={
              activeFilter === 'all'
                ? 'Small habits compound into big changes. Add one to begin.'
                : activeFilter === 'pending'
                  ? 'Come back tomorrow to keep your streak going.'
                  : 'Complete a habit today to see it here.'
            }
            action={activeFilter === 'all' ? {
              label:   'Add your first habit',
              onClick: () => setCreateOpen(true),
              icon:    <Plus />,
            } : undefined}
            className="py-14 rounded-2xl border border-border bg-muted/20"
          />
        )}

        {!isLoading && !isError && displayedHabits.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.div variants={stagger} className="space-y-2">
              {displayedHabits.map((habit) => (
                <motion.div key={habit.id} variants={fadeUp} layout>
                  <HabitCard
                    habit={habit}
                    completed={isCompleted(habit)}
                    onCheck={handleCheck}
                    onLog={handleLog}
                    onHistory={(h) => setHistoryHabit(h)}
                    onDelete={(h) => setDeleteHabit(h)}
                    loading={
                      logMutation.isPending &&
                      (logMutation.variables as { id: string })?.id === habit.id
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Mobile FAB */}
      <motion.button
        onClick={() => setCreateOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          'md:hidden fixed z-30 right-4',
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
          'h-14 w-14 rounded-full bg-primary text-primary-foreground',
          'shadow-lg shadow-primary/30 flex items-center justify-center',
        )}
        aria-label="Add new habit"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </motion.button>

      {/* Sheets & Modals */}
      <CreateHabitSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <LogModal habit={logHabit} onClose={() => setLogHabit(null)} dateStr={dateStr} />
      <HabitHistorySheet habit={historyHabit} onClose={() => setHistoryHabit(null)} />
      <DeleteHabitConfirm habit={deleteHabit} onClose={() => setDeleteHabit(null)} />
    </div>
  );
}
