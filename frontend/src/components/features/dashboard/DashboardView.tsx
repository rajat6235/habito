'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { CheckSquare, Flame, Target, Zap, BookOpen, ArrowRight, Plus, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTodayHabits, useLogHabit } from '@/hooks/api/useHabits';
import { StatCard } from '@/components/shared/StatCard';
import { HabitCard } from '@/components/shared/HabitCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

const QUOTES = [
  'The secret of getting ahead is getting started.',
  'Small daily improvements are the key to staggering long-term results.',
  'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
  'Motivation is what gets you started. Habit is what keeps you going.',
  "Don't count the days. Make the days count.",
  'Success is the sum of small efforts repeated day in and day out.',
  'Your future depends on what you do today.',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function getDailyQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function isCompleted(habit: Habit): boolean {
  return (habit as HabitWithTodayLog).todayLog?.status === 'completed';
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.4, 0.25, 1] } },
};

export function DashboardView() {
  const router     = useRouter();
  const { user }   = useAuth();
  const today      = new Date();
  const dateStr    = format(today, 'yyyy-MM-dd');
  const { data: habits = [], isLoading, isError } = useTodayHabits(today);
  const logHabit   = useLogHabit();

  const completed  = habits.filter(isCompleted).length;
  const total      = habits.length;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone    = total > 0 && completed === total;

  const displayName    = user?.firstName ?? user?.username ?? 'there';
  const longestStreak  = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  function handleCheck(habit: Habit, checked: boolean) {
    logHabit.mutate({
      id:      habit.id,
      payload: {
        date:   dateStr,
        status: checked ? 'completed' : 'skipped',
      },
    });
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 lg:p-8 space-y-8 max-w-3xl mx-auto"
    >
      {/* ── Greeting ── */}
      <motion.div variants={fadeUp} className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {format(today, 'EEEE, MMMM d')}
        </p>
        <h1 className="text-2xl md:text-[1.75rem] font-bold tracking-tight leading-tight">
          {getGreeting()},{' '}
          <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground italic">
          &ldquo;{getDailyQuote()}&rdquo;
        </p>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Today"
            value={isLoading ? '—' : `${completed}/${total}`}
            unit={total > 0 ? 'done' : ''}
            icon={<CheckSquare />}
            iconColor="bg-primary/10 text-primary"
            trend={allDone ? 'up' : 'neutral'}
            loading={isLoading}
          />
          <StatCard
            label="Best Streak"
            value={isLoading ? '—' : longestStreak}
            unit="days"
            icon={<Flame />}
            iconColor="bg-amber-500/10 text-amber-500"
            trend={longestStreak > 0 ? 'up' : 'neutral'}
            loading={isLoading}
          />
          <StatCard
            label="Active Goals"
            value="—"
            icon={<Target />}
            iconColor="bg-emerald-500/10 text-emerald-500"
            className="hidden xl:block"
          />
          <StatCard
            label="Total XP"
            value={user?.totalXp ?? '—'}
            unit={user?.totalXp ? 'XP' : ''}
            icon={<Zap />}
            iconColor="bg-violet-500/10 text-violet-500"
            className="hidden xl:block"
          />
        </div>
      </motion.div>

      {/* ── Today's Habits ── */}
      <motion.section variants={fadeUp} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Today&rsquo;s Habits</h2>
            {!isLoading && total > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {completed} of {total} completed
                {allDone && ' · Great work! 🎉'}
              </p>
            )}
          </div>
          <Link href="/app/habits" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}>
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Progress bar */}
        {!isLoading && total > 0 && (
          <Progress
            value={pct}
            className="h-1.5"
            indicatorClassName={allDone ? 'bg-emerald-500' : undefined}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[58px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <EmptyState
            icon={<CheckSquare />}
            title="Couldn't load habits"
            description="Make sure the server is running, then refresh."
            className="py-8 bg-muted/30 rounded-xl border border-border"
          />
        )}

        {/* Empty */}
        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={<CheckSquare />}
            title="No habits for today"
            description="Add your first habit and start building your routine."
            action={{ label: 'Add habit', onClick: () => router.push('/app/habits'), icon: <Plus /> }}
            className="py-8 bg-muted/30 rounded-xl border border-border"
          />
        )}

        {/* List */}
        {!isLoading && !isError && total > 0 && (
          <div className="space-y-2">
            {habits.slice(0, 6).map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit)}
                onCheck={handleCheck}
                loading={logHabit.isPending && (logHabit.variables as { id: string })?.id === habit.id}
              />
            ))}
            {total > 6 && (
              <Link
                href="/app/habits"
                className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                +{total - 6} more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </motion.section>

      {/* ── Quick actions ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/app/journal"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors group"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Daily Journal</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              How are you feeling today?
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        <Link
          href="/app/achievements"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors group"
        >
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Achievements</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              See your progress milestones
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
