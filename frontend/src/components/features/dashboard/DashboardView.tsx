'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { CheckSquare, Flame, ArrowRight, Plus, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTodayHabits, useLogHabit } from '@/hooks/api/useHabits';
import { HabitCard } from '@/components/shared/HabitCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/features/habits/components/ProgressRing';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

const QUOTES = [
  'Small daily improvements are the key to staggering long-term results.',
  'We are what we repeatedly do. Excellence is not an act, but a habit.',
  'Motivation is what gets you started. Habit is what keeps you going.',
  'Your future depends on what you do today.',
  'Success is the sum of small efforts repeated day in and day out.',
  'The secret of getting ahead is getting started.',
  "Don't count the days — make the days count.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Still at it?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function isCompleted(habit: Habit): boolean {
  return (habit as HabitWithTodayLog).todayLog?.status === 'completed';
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

export function DashboardView() {
  const router   = useRouter();
  const { user } = useAuth();
  const today    = new Date();
  const dateStr  = format(today, 'yyyy-MM-dd');

  const { data: habits = [], isLoading, isError } = useTodayHabits(today);
  const logHabit = useLogHabit();

  const completed     = habits.filter(isCompleted).length;
  const total         = habits.length;
  const pct           = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone       = total > 0 && completed === total;
  const maxStreak     = habits.reduce((m, h) => Math.max(m, h.currentStreak ?? 0), 0);
  const displayName   = user?.firstName ?? user?.username ?? 'there';

  function handleCheck(habit: Habit, checked: boolean) {
    logHabit.mutate({ id: habit.id, payload: { date: dateStr, status: checked ? 'completed' : 'skipped' } });
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 lg:p-8 space-y-7 max-w-2xl mx-auto pb-28 md:pb-10"
    >
      {/* ── Greeting ── */}
      <motion.div variants={fadeUp} className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {format(today, 'EEEE, MMMM d')}
        </p>
        <h1 className="text-[1.65rem] font-bold tracking-tight leading-tight">
          {getGreeting()},{' '}
          <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          &ldquo;{getDailyQuote()}&rdquo;
        </p>
      </motion.div>

      {/* ── Today's progress + streak row ── */}
      {!isLoading && total > 0 && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          {/* Progress ring card */}
          <div
            className={cn(
              'flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500',
              allDone
                ? 'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07]'
                : 'border-border bg-card',
            )}
          >
            <ProgressRing
              percentage={pct}
              completed={completed}
              total={total}
              size={72}
              strokeWidth={6}
              className="shrink-0"
            />
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-base font-bold tabular-nums">
                {allDone ? 'All done! 🎉' : `${completed}/${total}`}
              </p>
            </div>
          </div>

          {/* Streak card */}
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best streak</p>
              <p className="text-base font-bold tabular-nums text-amber-500">
                {maxStreak > 0 ? `${maxStreak}d` : '—'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Today's Habits ── */}
      <motion.section variants={fadeUp} className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[15px] font-semibold">Today&rsquo;s habits</h2>
          <Link
            href="/app/habits"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0 text-muted-foreground hover:text-foreground h-8 px-2.5')}
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[0.95, 0.75, 0.85, 0.65].map((opacity, i) => (
              <Skeleton key={i} className="h-[62px] rounded-xl" style={{ opacity }} />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <EmptyState
            icon={<CheckSquare />}
            title="Couldn't load habits"
            description="Check your connection and refresh."
            className="py-8 bg-muted/30 rounded-2xl border border-border"
          />
        )}

        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={<CheckSquare />}
            title="No habits yet"
            description="Add your first habit and start building your routine."
            action={{ label: 'Add habit', onClick: () => router.push('/app/habits'), icon: <Plus /> }}
            className="py-8 bg-muted/30 rounded-2xl border border-border"
          />
        )}

        {!isLoading && !isError && total > 0 && (
          <div className="space-y-2">
            {habits.slice(0, 5).map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit)}
                onCheck={handleCheck}
                onLog={() => router.push('/app/habits')}
                loading={logHabit.isPending && (logHabit.variables as { id: string })?.id === habit.id}
              />
            ))}
            {total > 5 && (
              <Link
                href="/app/habits"
                className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
              >
                +{total - 5} more habits
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </motion.section>

      {/* ── Quick actions ── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/app/journal"
          className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-all group hover:border-border/80 hover:shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Daily Journal</p>
            <p className="text-xs text-muted-foreground mt-0.5">How are you feeling today?</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
