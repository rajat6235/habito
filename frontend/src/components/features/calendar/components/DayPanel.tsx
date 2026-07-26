'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { format, parseISO, isSameDay } from 'date-fns';
import {
  CheckCircle2, Circle, BookOpen, ClipboardList, Target,
  Shield, Flame, SkipForward, XCircle, Star, Wallet, PartyPopper, Repeat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useTodayHabits, useHabits } from '@/hooks/api/useHabits';
import { useJournalByDate } from '@/hooks/api/useJournal';
import { usePlannerTasks } from '@/hooks/api/usePlanner';
import { useGoals } from '@/hooks/api/useGoals';
import { useRecoveryGoals } from '@/hooks/api/useRecovery';
import { useExpenses } from '@/hooks/api/useExpenses';
import { recoveryApi } from '@/lib/api/recovery.api';
import { habitsApi } from '@/lib/api/habits.api';
import { buildStreakSegments, getRecoveryDayInfo } from '@/components/features/recovery/utils/timeline';
import { ALL_CALENDAR_MODULES, type CalendarModule } from '../calendar.constants';
import type { HabitWithTodayLog } from '@shared/types/api.types';

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon, title, count, children,
}: {
  icon:     React.ReactNode;
  title:    string;
  count?:   number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {count != null && count > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">{count}</Badge>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────

function DayScoreBadge({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
    pct >= 60 ? 'bg-violet-500/15 text-violet-700 dark:text-violet-400' :
    pct >= 30 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', color)}>
      {pct}%
    </span>
  );
}

// ── Mood display ──────────────────────────────────────────────────────────────

function MoodRow({ label, value }: { label: string; value: number }) {
  const EMOJIS = ['😞', '😕', '😐', '🙂', '😊', '😄', '🥰', '🤩', '💪', '🚀'];
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{EMOJIS[value - 1] ?? '😐'}</span>
        <span className="text-xs font-medium tabular-nums">{value}/10</span>
      </div>
    </div>
  );
}

// ── DayPanel ──────────────────────────────────────────────────────────────────

interface DayPanelProps {
  date:    Date | null;
  onClose: () => void;
  active?: Set<CalendarModule>;
}

export function DayPanel({ date, onClose, active = ALL_CALENDAR_MODULES }: DayPanelProps) {
  const open   = Boolean(date);
  const dayStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  // All data hooks — enabled only when panel is open
  const { data: habitsRaw = [], isLoading: habitsLoading, isError: habitsError } = useTodayHabits(date ?? undefined);
  const habits = habitsRaw as HabitWithTodayLog[];
  const { data: journal = [], isLoading: journalLoading } = useJournalByDate(date ?? undefined);
  const { data: tasks   = [], isLoading: tasksLoading   } = usePlannerTasks(
    date ? format(date, 'yyyy-MM-dd') : '',
  );
  const { data: goals   = [], isLoading: goalsLoading   } = useGoals();
  const { data: recovery= [], isLoading: recoveryLoading} = useRecoveryGoals();

  // Recovery — reconstruct accurate per-day status from each goal's real relapse
  // history (same utility RecoveryCalendarTab uses), instead of approximating.
  const relapseQueries = useQueries({
    queries: recovery.map((goal) => ({
      queryKey: ['recovery', goal.id, 'relapses', 'day-panel'],
      queryFn:  () => recoveryApi.getRelapses(goal.id),
      staleTime: 30_000,
      enabled:   open,
    })),
  });
  const recoveryToday = useMemo(() => {
    return recovery
      .map((goal, i) => {
        const relapses = relapseQueries[i]?.data ?? [];
        const segments = buildStreakSegments(goal, relapses);
        const info     = getRecoveryDayInfo(date ?? new Date(), goal, segments);
        return { goal, info };
      })
      .filter((r) => r.info.status && r.info.status !== 'before-start');
  }, [recovery, relapseQueries, date]);

  // Event-based habits — logged occurrences on this specific day
  const { data: eventHabitPages } = useHabits({ habitType: 'event' });
  const eventHabitsList = useMemo(() => eventHabitPages?.pages.flatMap(p => p.data) ?? [], [eventHabitPages]);
  const eventLogQueries = useQueries({
    queries: eventHabitsList.map((habit) => ({
      queryKey: ['habits', habit.id, 'logs', 'day-panel', dayStr],
      queryFn:  () => habitsApi.getLogs(habit.id, { from: dayStr, to: dayStr, limit: 5 }),
      staleTime: 60_000,
      enabled:   open,
    })),
  });
  const eventHabitsToday = useMemo(() => {
    return eventHabitsList
      .map((habit, i) => {
        const log = eventLogQueries[i]?.data?.data.find(l => l.status === 'completed');
        return { habit, log };
      })
      .filter((e) => e.log);
  }, [eventHabitsList, eventLogQueries]);

  // Expenses on this day
  const { data: expensePages, isLoading: expensesLoading } = useExpenses({ from: dayStr, to: dayStr, limit: 20 });
  const expensesToday = useMemo(() => expensePages?.pages.flatMap(p => p.data) ?? [], [expensePages]);
  const expensesTotal = useMemo(() => expensesToday.reduce((s, e) => s + e.total, 0), [expensesToday]);

  const isLoading = habitsLoading || journalLoading || tasksLoading || goalsLoading || recoveryLoading || expensesLoading;

  // Compute day score from habits
  const completedHabits = useMemo(
    () => habits.filter((h) => h.todayLog?.status === 'completed').length,
    [habits],
  );
  const dayScore = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
  const hasRelapseToday = recoveryToday.some((r) => r.info.status === 'relapse');
  const isPerfectDay = dayScore === 100 && habits.length > 0 && !hasRelapseToday;

  // Filter goals that have milestones completed on this date
  const relevantGoals = useMemo(() => {
    if (!date) return [];
    return goals
      .filter((g) => {
        const hasMilestoneToday = g.milestones?.some((m) => {
          if (!m.completedAt) return false;
          return isSameDay(parseISO(m.completedAt), date);
        });
        const isDeadlineToday = g.targetDate && isSameDay(parseISO(g.targetDate), date);
        return hasMilestoneToday || isDeadlineToday;
      });
  }, [goals, date]);

  const morningEntry = journal.find((e) => e.entryType === 'morning');
  const eveningEntry = journal.find((e) => e.entryType === 'evening');
  const freeEntry    = journal.find((e) => e.entryType === 'free_write');
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const pendingTasks   = tasks.filter((t) => !t.isCompleted);

  if (!date) return null;

  const isToday   = isSameDay(date, new Date());
  const dateLabel = isToday
    ? 'Today'
    : format(date, 'EEEE, MMMM d, yyyy');

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-5 pt-safe-or-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {/* Day score ring */}
            {!isLoading && habits.length > 0 && (
              <div className="relative h-10 w-10 shrink-0">
                <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
                  <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
                  <circle
                    cx="20" cy="20" r="16" fill="none"
                    stroke={dayScore === 100 ? '#10b981' : dayScore >= 60 ? '#6d60f0' : '#f59e0b'}
                    strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - dayScore / 100)}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
                  {dayScore}%
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <SheetTitle className="text-base leading-tight">{dateLabel}</SheetTitle>
                {!isLoading && isPerfectDay && (
                  <Badge className="text-[10px] h-4 px-1.5 gap-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <PartyPopper className="h-2.5 w-2.5" aria-hidden />
                    Perfect day
                  </Badge>
                )}
              </div>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                {!isLoading && !habitsError && completedHabits > 0 && (
                  <span className="text-xs">
                    {completedHabits}/{habits.length} habits done
                  </span>
                )}
                {!isLoading && habitsError && (
                  <span className="text-xs text-destructive/70">Habits unavailable</span>
                )}
                {!isLoading && !habitsError && habits.length === 0 && (
                  <span className="text-xs text-muted-foreground/60">No habits scheduled</span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >

                {/* ── Habits ── */}
                {active.has('habits') && habits.length > 0 && (
                  <Section
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title="Habits"
                    count={completedHabits}
                  >
                    <div className="space-y-1.5">
                      {habits.map((habit: any) => {
                        const log    = habit.todayLog;
                        const status = log?.status;
                        return (
                          <div
                            key={habit.id}
                            className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-muted/40"
                          >
                            <span className="text-base leading-none shrink-0">
                              {habit.icon ?? '⭕'}
                            </span>
                            <span className={cn(
                              'flex-1 text-sm truncate',
                              status === 'completed' && 'line-through text-muted-foreground',
                            )}>
                              {habit.title}
                            </span>
                            <span className="shrink-0">
                              {status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : status === 'skipped' ? (
                                <SkipForward className="h-4 w-4 text-amber-500" />
                              ) : status === 'failed' ? (
                                <XCircle className="h-4 w-4 text-rose-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {habits.length > 0 && (
                      <Progress value={dayScore} className="h-1.5 mt-1" />
                    )}
                  </Section>
                )}

                {/* ── Event-Based Habits ── */}
                {active.has('event') && eventHabitsToday.length > 0 && (
                  <Section
                    icon={<Repeat className="h-4 w-4" />}
                    title="Event-Based Habits"
                    count={eventHabitsToday.length}
                  >
                    <div className="space-y-1.5">
                      {eventHabitsToday.map(({ habit }) => (
                        <div
                          key={habit.id}
                          className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-teal-500/[0.06]"
                        >
                          <span className="text-base leading-none shrink-0">{habit.icon ?? '🔁'}</span>
                          <span className="flex-1 text-sm truncate">{habit.title}</span>
                          <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Journal ── */}
                {active.has('journal') && journal.length > 0 && (
                  <Section
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Journal"
                    count={journal.length}
                  >
                    <div className="space-y-2.5">
                      {morningEntry && (
                        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">🌅</span>
                            <span className="text-xs font-semibold text-muted-foreground">Morning</span>
                          </div>
                          {morningEntry.moodMorning != null && (
                            <MoodRow label="Mood" value={morningEntry.moodMorning} />
                          )}
                          {morningEntry.energyLevel != null && (
                            <MoodRow label="Energy" value={morningEntry.energyLevel} />
                          )}
                          {morningEntry.gratitude?.length > 0 && (
                            <div className="space-y-0.5">
                              {morningEntry.gratitude.slice(0, 2).map((g: string, i: number) => (
                                <p key={i} className="text-xs text-muted-foreground truncate">
                                  ✦ {g}
                                </p>
                              ))}
                            </div>
                          )}
                          {morningEntry.intention && (
                            <p className="text-xs text-foreground/80 italic line-clamp-2">
                              &ldquo;{morningEntry.intention}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {eveningEntry && (
                        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">🌙</span>
                            <span className="text-xs font-semibold text-muted-foreground">Evening</span>
                            {eveningEntry.dayRating != null && (
                              <div className="ml-auto flex items-center gap-0.5">
                                {Array.from({ length: eveningEntry.dayRating }).map((_, i) => (
                                  <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          {eveningEntry.moodEvening != null && (
                            <MoodRow label="Mood" value={eveningEntry.moodEvening} />
                          )}
                          {eveningEntry.wins?.length > 0 && (
                            <div className="space-y-0.5">
                              {eveningEntry.wins.slice(0, 2).map((w: string, i: number) => (
                                <p key={i} className="text-xs text-muted-foreground truncate">
                                  🏆 {w}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {freeEntry?.content && (
                        <div className="rounded-xl border border-border bg-card p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">✏️ Free write</p>
                          <p className="text-xs text-foreground/80 line-clamp-3">{freeEntry.content}</p>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* ── Expenses ── */}
                {active.has('expenses') && expensesToday.length > 0 && (
                  <Section
                    icon={<Wallet className="h-4 w-4" />}
                    title="Expenses"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground -mt-1">
                        {formatCurrency(expensesTotal)} total
                      </p>
                      {expensesToday.map((exp) => (
                        <div key={exp.id} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {exp.category.icon && (
                                <span className="text-[13px] shrink-0" aria-hidden>{exp.category.icon}</span>
                              )}
                              <span className="text-xs font-semibold truncate">
                                {exp.title || exp.category.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold tabular-nums shrink-0">{formatCurrency(exp.total)}</span>
                          </div>
                          <div className="space-y-0.5">
                            {exp.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Planner ── */}
                {active.has('planner') && tasks.length > 0 && (
                  <Section
                    icon={<ClipboardList className="h-4 w-4" />}
                    title="Tasks"
                    count={completedTasks.length}
                  >
                    <div className="space-y-1">
                      {completedTasks.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-emerald-500/[0.05]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs text-muted-foreground line-through truncate">{t.title}</span>
                        </div>
                      ))}
                      {pendingTasks.slice(0, 3).map((t) => (
                        <div key={t.id} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-muted/40">
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <span className="text-xs truncate">{t.title}</span>
                        </div>
                      ))}
                      {pendingTasks.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-2.5">
                          +{pendingTasks.length - 3} more pending
                        </p>
                      )}
                    </div>
                  </Section>
                )}

                {/* ── Goals ── */}
                {relevantGoals.length > 0 && (
                  <Section
                    icon={<Target className="h-4 w-4" />}
                    title="Goals"
                    count={relevantGoals.length}
                  >
                    <div className="space-y-2">
                      {relevantGoals.map((g) => {
                        const milestonesToday = g.milestones?.filter(
                          (m) => m.completedAt && date && isSameDay(parseISO(m.completedAt), date),
                        ) ?? [];
                        const isDeadline = g.targetDate && date && isSameDay(parseISO(g.targetDate), date);
                        return (
                          <div key={g.id} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold truncate flex-1">{g.title}</span>
                              {isDeadline && (
                                <Badge className="text-[10px] h-4 px-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                  Deadline
                                </Badge>
                              )}
                            </div>
                            <Progress value={g.progressPct} className="h-1" />
                            {milestonesToday.map((m) => (
                              <p key={m.id} className="text-xs text-emerald-600 dark:text-emerald-400">
                                ✓ {m.title}
                              </p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* ── Recovery ── */}
                {active.has('recovery') && recoveryToday.length > 0 && (
                  <Section
                    icon={<Shield className="h-4 w-4" />}
                    title="Recovery"
                    count={recoveryToday.length}
                  >
                    <div className="space-y-2">
                      {recoveryToday.map(({ goal: g, info }) => {
                        const isRelapse   = info.status === 'relapse';
                        const isMilestone = info.status === 'milestone';
                        return (
                          <div
                            key={g.id}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border p-3',
                              isRelapse ? 'border-rose-500/30 bg-rose-500/[0.04]' : 'border-border bg-card',
                            )}
                          >
                            <div
                              className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                              style={{ backgroundColor: g.color ? `${g.color}20` : undefined }}
                            >
                              {isRelapse ? '💔' : g.icon ?? '🛡️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{g.name}</p>
                              <p className={cn('text-xs', isRelapse ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                                {isRelapse ? 'Relapse' : `Day ${info.dayNumber}`}
                              </p>
                            </div>
                            {!isRelapse && info.dayNumber != null && (
                              <div className={cn('flex items-center gap-0.5 shrink-0', isMilestone ? 'text-amber-500' : 'text-emerald-500')}>
                                {isMilestone ? <Star className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
                                <span className="text-xs font-bold tabular-nums">{info.dayNumber}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* Empty state */}
                {!isLoading &&
                  habits.length === 0 &&
                  eventHabitsToday.length === 0 &&
                  journal.length === 0 &&
                  tasks.length === 0 &&
                  expensesToday.length === 0 &&
                  relevantGoals.length === 0 &&
                  recoveryToday.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="text-4xl mb-3">📅</span>
                      <p className="text-sm font-medium text-muted-foreground">Nothing logged yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {isToday
                          ? 'Your activity will appear here as you log habits, tasks, and journal entries.'
                          : 'No activity was recorded for this day.'}
                      </p>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
