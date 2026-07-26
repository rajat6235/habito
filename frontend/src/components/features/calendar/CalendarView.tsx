'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday,
  isSameMonth, addWeeks, subWeeks,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  BarChart2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCalendarMonth, useCalendarHeatmap, useCalendarExtras } from '@/hooks/api/useCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthGrid }   from './components/MonthGrid';
import { WeekStrip }   from './components/WeekStrip';
import { HeatmapView } from './components/HeatmapView';
import { DayPanel }    from './components/DayPanel';
import { CALENDAR_MODULES, ALL_CALENDAR_MODULES, type CalendarModule } from './calendar.constants';
import { buildDayCell, type DayCellData, type DayEvent } from './dayEvents';
import type { CalendarDay } from '@shared/types/api.types';

// ── Types ─────────────────────────────────────────────────────────────────────

type CalView = 'month' | 'week' | 'heatmap';

// ── Month insights — short, literal sentences generated from the same events
// that power the day cells, so "how was my month" never requires opening a date.

function MonthInsights({ cellData, days }: { cellData: Map<string, DayCellData>; days: CalendarDay[] }) {
  const rows = useMemo(() => {
    const out: { icon: string; text: React.ReactNode }[] = [];
    const activeDays = days.filter((d) => d.habitsScheduled > 0);
    if (activeDays.length > 0) {
      const avgPct = Math.round(activeDays.reduce((s, d) => s + d.habitCompletionPct, 0) / activeDays.length);
      out.push({ icon: '✅', text: <>You completed <b>{avgPct}%</b> of your habits this month.</> });
    }

    const allEvents = Array.from(cellData.values()).flatMap((c) => c.events);
    const perfectDays = Array.from(cellData.values()).filter((c) => c.notable === 'perfect').length;
    const relapses    = allEvents.filter((e) => e.notable === 'relapse').length;
    const longestStreak = allEvents
      .filter((e) => e.module === 'recovery' && e.metric != null)
      .reduce((max, e) => Math.max(max, e.metric ?? 0), 0);
    const totalSpent = allEvents.filter((e) => e.module === 'expenses').reduce((s, e) => s + (e.metric ?? 0), 0);

    const eventHabitCounts = new Map<string, number>();
    for (const e of allEvents) {
      if (e.module !== 'event-habit') continue;
      eventHabitCounts.set(e.headline, (eventHabitCounts.get(e.headline) ?? 0) + 1);
    }
    const topEventHabit = [...eventHabitCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    if (longestStreak > 0) out.push({ icon: '🔥', text: <>Longest recovery streak this month: <b>{longestStreak} days</b>.</> });
    if (relapses > 0)      out.push({ icon: '💔', text: <><b>{relapses}</b> relapse{relapses > 1 ? 's' : ''} logged this month.</> });
    if (totalSpent > 0)    out.push({ icon: '💰', text: <>You spent <b>{formatCurrency(totalSpent)}</b> this month.</> });
    if (topEventHabit)     out.push({ icon: '🔁', text: <>You logged <b>{topEventHabit[0]}</b> {topEventHabit[1]} time{topEventHabit[1] > 1 ? 's' : ''}.</> });
    if (perfectDays > 0)   out.push({ icon: '⭐', text: <>You had <b>{perfectDays}</b> perfect day{perfectDays > 1 ? 's' : ''}.</> });

    return out;
  }, [cellData, days]);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <span className="text-[15px] leading-none shrink-0" aria-hidden>{r.icon}</span>
          <p className="text-[12.5px] text-muted-foreground leading-snug">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Module filter bar ─────────────────────────────────────────────────────────

function ModuleFilterBar({ active, onToggle }: { active: Set<CalendarModule>; onToggle: (m: CalendarModule) => void }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
      {CALENDAR_MODULES.map((m) => {
        const on = active.has(m.key);
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onToggle(m.key)}
            aria-pressed={on}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0',
              on ? 'bg-muted text-foreground' : 'bg-muted/30 text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full shrink-0', on ? m.dot : 'bg-muted-foreground/30')} />
            {m.label}
          </button>
        );
      })}
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
          aria-pressed={active === v.key}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            active === v.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {v.icon}
          <span>{v.label}</span>
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
  const [activeModules, setActiveModules] = useState<Set<CalendarModule>>(ALL_CALENDAR_MODULES);

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

  // Recovery / event-habit / expense extras, composed client-side from their own
  // existing endpoints — scoped to whichever range is currently visible.
  const extrasFrom = format(view === 'week' ? startOfWeek(weekAnchor, { weekStartsOn: 0 }) : startOfMonth(currentMonth), 'yyyy-MM-dd');
  const extrasTo   = format(view === 'week' ? endOfWeek(weekAnchor,   { weekStartsOn: 0 }) : endOfMonth(currentMonth),   'yyyy-MM-dd');
  const { data: extras } = useCalendarExtras(extrasFrom, extrasTo);

  // One ranked headline + life score per day, built once here and read by both
  // the month grid and the insights list — the day cells never branch on module.
  const monthCellData = useMemo(() => {
    const map = new Map<string, DayCellData>();
    for (const day of monthDays) {
      const moduleEvents: DayEvent[] = extras.get(day.date)?.events ?? [];
      map.set(day.date, buildDayCell(day, moduleEvents, activeModules));
    }
    return map;
  }, [monthDays, extras, activeModules]);

  function toggleModule(m: CalendarModule) {
    setActiveModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Life Calendar
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {view === 'heatmap'
                ? 'Activity Heatmap'
                : format(view === 'week' ? weekAnchor : currentMonth, 'MMMM yyyy')}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isCurrentMonth && view !== 'heatmap' && (
              <button
                type="button"
                onClick={goToday}
                className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/5 transition-colors"
              >
                Today
              </button>
            )}
            {view !== 'heatmap' && (
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={view === 'week' ? () => setWeekAnchor(subWeeks(weekAnchor, 1)) : prevMonth}
                  className="rounded-md p-1.5 hover:bg-background hover:shadow-sm transition-all"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={view === 'week' ? () => setWeekAnchor(addWeeks(weekAnchor, 1)) : nextMonth}
                  className="rounded-md p-1.5 hover:bg-background hover:shadow-sm transition-all"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Insights ── */}
        {monthLoading ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[38px] rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : (
          <MonthInsights cellData={monthCellData} days={monthDays} />
        )}

        {/* ── Filters ── */}
        <ModuleFilterBar active={activeModules} onToggle={toggleModule} />

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
                cellData={monthCellData}
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
                extras={extras}
                active={activeModules}
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
              'border border-dashed border-primary/30 text-primary/70 bg-primary/[0.02]',
              'hover:border-primary/60 hover:text-primary hover:bg-primary/[0.04]',
              'transition-all text-sm font-semibold',
            )}
          >
            <CalendarDays className="h-4 w-4" />
            View today&apos;s summary
          </motion.button>
        )}
      </motion.div>

      {/* ── Day panel ── */}
      {panelOpen && (
        <DayPanel
          date={selectedDate}
          onClose={() => { setPanelOpen(false); }}
          active={activeModules}
        />
      )}
    </div>
  );
}
