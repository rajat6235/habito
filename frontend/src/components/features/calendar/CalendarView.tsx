'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, addMonths, subMonths, startOfWeek, isToday,
  isSameMonth, addWeeks, subWeeks,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  Activity, CheckSquare, BookOpen, Flame, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarMonth, useCalendarHeatmap } from '@/hooks/api/useCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthGrid }   from './components/MonthGrid';
import { WeekStrip }   from './components/WeekStrip';
import { HeatmapView } from './components/HeatmapView';
import { DayPanel }    from './components/DayPanel';
import type { CalendarDay } from '@shared/types/api.types';

// ── Types ─────────────────────────────────────────────────────────────────────

type CalView = 'month' | 'week' | 'heatmap';

// ── Insights bar ──────────────────────────────────────────────────────────────

interface InsightCardProps {
  icon:  React.ReactNode;
  label: string;
  value: string;
  sub?:  string;
  color: string;
}

function InsightCard({ icon, label, value, sub, color }: InsightCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-base font-bold tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

function InsightsBar({ days }: { days: CalendarDay[] }) {
  const stats = useMemo(() => {
    const activeDays    = days.filter((d) => d.habitsScheduled > 0);
    const totalCompleted = days.reduce((s, d) => s + d.habitsCompleted, 0);
    const totalScheduled = days.reduce((s, d) => s + d.habitsScheduled, 0);
    const avgPct = activeDays.length > 0
      ? Math.round(activeDays.reduce((s, d) => s + d.habitCompletionPct, 0) / activeDays.length)
      : 0;

    const moodDays = days.filter((d) => d.moodMorning != null || d.moodEvening != null);
    const avgMood  = moodDays.length > 0
      ? (moodDays.reduce((s, d) => s + (d.moodMorning ?? d.moodEvening ?? 0), 0) / moodDays.length)
      : 0;

    const journalDays = days.filter((d) => d.journalWritten).length;

    const tasksCompleted = days.reduce((s, d) => s + d.tasksCompleted, 0);

    // Journal streak (consecutive days from today backwards)
    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (const d of sorted) {
      if (d.journalWritten) streak++;
      else break;
    }

    return { totalCompleted, totalScheduled, avgPct, avgMood, journalDays, tasksCompleted, streak };
  }, [days]);

  const EMOJIS = ['😞','😕','😐','🙂','😊','😄','🥰','🤩','💪','🚀'];
  const moodDisplay = stats.avgMood > 0
    ? `${EMOJIS[Math.round(stats.avgMood) - 1]} ${stats.avgMood.toFixed(1)}`
    : '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      <InsightCard
        icon={<CheckSquare className="h-4 w-4" />}
        label="Habits this month"
        value={stats.totalScheduled > 0 ? `${stats.totalCompleted}/${stats.totalScheduled}` : '—'}
        sub={stats.totalScheduled > 0 ? `${stats.avgPct}% avg` : undefined}
        color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
      <InsightCard
        icon={<BookOpen className="h-4 w-4" />}
        label="Journal streak"
        value={stats.streak > 0 ? `${stats.streak}d` : '—'}
        sub={`${stats.journalDays} days written`}
        color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <InsightCard
        icon={<Flame className="h-4 w-4" />}
        label="Avg mood"
        value={moodDisplay}
        sub={`from ${stats.journalDays} entries`}
        color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <InsightCard
        icon={<Activity className="h-4 w-4" />}
        label="Tasks done"
        value={stats.tasksCompleted > 0 ? String(stats.tasksCompleted) : '—'}
        color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
      />
    </div>
  );
}

// ── View switcher ─────────────────────────────────────────────────────────────

const VIEWS: { key: CalView; label: string; icon: React.ReactNode }[] = [
  { key: 'month',   label: 'Month',   icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: 'week',    label: 'Week',    icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: 'heatmap', label: 'Heatmap', icon: <BarChart2 className="h-3.5 w-3.5" /> },
];

function ViewSwitcher({ active, onChange }: { active: CalView; onChange: (v: CalView) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onChange(v.key)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            active === v.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {v.icon}
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── CalendarView ──────────────────────────────────────────────────────────────

export function CalendarView() {
  const today = useMemo(() => new Date(), []);

  const [view,         setView]         = useState<CalView>('month');
  const [currentMonth, setCurrentMonth] = useState(today);
  const [weekAnchor,   setWeekAnchor]   = useState(() => startOfWeek(today, { weekStartsOn: 0 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [panelOpen,    setPanelOpen]    = useState(false);

  // Month data
  const { data: monthDays = [], isLoading: monthLoading } = useCalendarMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
  );

  // Heatmap data (91 days) — only fetched when heatmap tab is active
  const { data: heatDays = [] } = useCalendarHeatmap(91);

  // Week view data comes from monthDays (same month) + a bit extra
  const weekDays = useMemo(() => {
    if (view !== 'week') return [];
    // Combine month data; for simplicity just pass monthDays
    return monthDays;
  }, [monthDays, view]);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setPanelOpen(true);
    // Navigate to month if date is in a different month
    if (!isSameMonth(date, currentMonth) && view === 'month') {
      setCurrentMonth(date);
    }
  }

  function prevMonth()  { setCurrentMonth((m) => subMonths(m, 1)); }
  function nextMonth()  { setCurrentMonth((m) => addMonths(m, 1)); }
  function goToday()    {
    setCurrentMonth(today);
    setWeekAnchor(startOfWeek(today, { weekStartsOn: 0 }));
  }

  const isCurrentMonth = isSameMonth(currentMonth, today);

  return (
    <div className="relative min-h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto pb-28 md:pb-10 space-y-5"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Life Calendar
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {view === 'heatmap'
                ? 'Activity Heatmap'
                : format(view === 'week' ? weekAnchor : currentMonth, 'MMMM yyyy')}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCurrentMonth && view !== 'heatmap' && (
              <button
                type="button"
                onClick={goToday}
                className="text-xs font-medium text-primary hover:underline"
              >
                Today
              </button>
            )}
            {view !== 'heatmap' && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={view === 'week' ? () => setWeekAnchor(subWeeks(weekAnchor, 1)) : prevMonth}
                  className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={view === 'week' ? () => setWeekAnchor(addWeeks(weekAnchor, 1)) : nextMonth}
                  className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Insights bar ── */}
        {monthLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] rounded-2xl" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : (
          <InsightsBar days={monthDays} />
        )}

        {/* ── View switcher ── */}
        <ViewSwitcher active={view} onChange={setView} />

        {/* ── Main content ── */}
        {view === 'month' && (
          monthLoading ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              <MonthGrid
                month={currentMonth}
                days={monthDays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>
          )
        )}

        {view === 'week' && (
          monthLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              <WeekStrip
                anchor={weekAnchor}
                onAnchorChange={setWeekAnchor}
                days={weekDays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>
          )
        )}

        {view === 'heatmap' && (
          <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
            <HeatmapView onSelectDate={handleSelectDate} />
          </div>
        )}

        {/* ── Today's entry CTA — shown when nothing selected ── */}
        {!selectedDate && !monthLoading && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => handleSelectDate(today)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl',
              'border border-dashed border-border text-muted-foreground',
              'hover:border-primary/50 hover:text-primary hover:bg-primary/[0.02]',
              'transition-all text-sm font-medium',
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Open today&apos;s summary
          </motion.button>
        )}
      </motion.div>

      {/* ── Day panel ── */}
      {panelOpen && (
        <DayPanel
          date={selectedDate}
          onClose={() => { setPanelOpen(false); }}
        />
      )}
    </div>
  );
}
