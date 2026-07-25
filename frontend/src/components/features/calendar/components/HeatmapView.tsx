'use client';

import { useMemo, useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarHeatmap } from '@/hooks/api/useCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarDay } from '@shared/types/api.types';

// ── Types ─────────────────────────────────────────────────────────────────────

type HeatMetric = 'habits' | 'journal' | 'tasks' | 'overall';

const METRICS: { key: HeatMetric; label: string; activeClass: string; dotClass: string }[] = [
  { key: 'habits',  label: 'Habits',  activeClass: 'bg-violet-600 text-white',  dotClass: 'bg-violet-500' },
  { key: 'journal', label: 'Journal', activeClass: 'bg-blue-600 text-white',    dotClass: 'bg-blue-500'   },
  { key: 'tasks',   label: 'Tasks',   activeClass: 'bg-orange-500 text-white',  dotClass: 'bg-orange-400' },
  { key: 'overall', label: 'Overall', activeClass: 'bg-emerald-600 text-white', dotClass: 'bg-emerald-500'},
];

// ── Color scales ─────────────────────────────────────────────────────────────

const HABIT_SCALE  = ['bg-muted/50', 'bg-violet-200/70 dark:bg-violet-900/50', 'bg-violet-300/80 dark:bg-violet-700/60', 'bg-violet-500/80', 'bg-violet-600'];
const JOURNAL_SCALE= ['bg-muted/50', 'bg-blue-500'];
const TASKS_SCALE  = ['bg-muted/50', 'bg-orange-200/70 dark:bg-orange-900/40', 'bg-orange-400/70', 'bg-orange-500'];
const OVERALL_SCALE= ['bg-muted/50', 'bg-emerald-200/70 dark:bg-emerald-900/40', 'bg-emerald-300/80 dark:bg-emerald-700/50', 'bg-emerald-500/80', 'bg-emerald-600'];

function cellColorClass(day: CalendarDay | undefined, metric: HeatMetric, tooEarly: boolean): string {
  if (tooEarly || !day) return 'bg-muted/40';

  switch (metric) {
    case 'habits': {
      const pct = day.habitCompletionPct;
      if (day.habitsScheduled === 0) return HABIT_SCALE[0]!;
      if (pct === 100) return HABIT_SCALE[4]!;
      if (pct >= 75)   return HABIT_SCALE[3]!;
      if (pct >= 50)   return HABIT_SCALE[2]!;
      if (pct >= 25)   return HABIT_SCALE[1]!;
      return HABIT_SCALE[0]!;
    }
    case 'journal':
      return day.journalWritten ? JOURNAL_SCALE[1]! : JOURNAL_SCALE[0]!;
    case 'tasks': {
      const done  = day.tasksCompleted;
      const sched = day.tasksScheduled;
      if (sched === 0 && done === 0) return TASKS_SCALE[0]!;
      if (done >= sched && done > 0) return TASKS_SCALE[3]!;
      if (done > 0)                  return TASKS_SCALE[2]!;
      if (sched > 0)                 return TASKS_SCALE[1]!;
      return TASKS_SCALE[0]!;
    }
    case 'overall': {
      const score = (
        (day.habitsScheduled > 0  ? day.habitCompletionPct / 100 : 0) +
        (day.journalWritten ? 1 : 0) +
        (day.tasksScheduled > 0 ? (day.tasksCompleted / day.tasksScheduled) : 0)
      ) / 3;
      if (score >= 0.9) return OVERALL_SCALE[4]!;
      if (score >= 0.6) return OVERALL_SCALE[3]!;
      if (score >= 0.3) return OVERALL_SCALE[2]!;
      if (score > 0)    return OVERALL_SCALE[1]!;
      return OVERALL_SCALE[0]!;
    }
  }
}

// ── Grid builder ──────────────────────────────────────────────────────────────

function buildGrid(days: CalendarDay[], daysBack: number) {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMap   = new Map(days.map((d) => [d.date.slice(0, 10), d]));
  const earliest = subDays(today, daysBack - 1);
  const offset   = earliest.getDay();
  const startDate = subDays(earliest, offset);

  const weeks: { date: string; day: CalendarDay | undefined; tooEarly: boolean }[][] = [];
  let   week:  typeof weeks[0] = [];
  let   cursor = new Date(startDate);

  while (cursor <= today) {
    const iso      = format(cursor, 'yyyy-MM-dd');
    const tooEarly = cursor < earliest;
    week.push({ date: iso, day: dayMap.get(iso), tooEarly });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  if (week.length) weeks.push(week);
  return weeks;
}

function buildMonthLabels(weeks: { date: string }[][]) {
  const labels: { label: string; colStart: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, col) => {
    const firstDay = week.find((c) => c.date);
    if (!firstDay) return;
    const m = format(parseISO(firstDay.date), 'MMM');
    if (m !== lastMonth) { labels.push({ label: m, colStart: col + 1 }); lastMonth = m; }
  });
  return labels;
}

const DAY_ABBRS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// ── HeatmapView ───────────────────────────────────────────────────────────────

interface HeatmapViewProps {
  onSelectDate?: (date: Date) => void;
}

export function HeatmapView({ onSelectDate }: HeatmapViewProps) {
  const [metric, setMetric] = useState<HeatMetric>('overall');
  const { data = [], isLoading } = useCalendarHeatmap(91);

  const weeks       = useMemo(() => buildGrid(data, 91), [data]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  const totalActive = useMemo(() => {
    return data.filter((d) => {
      if (metric === 'habits')  return d.habitsCompleted > 0;
      if (metric === 'journal') return d.journalWritten;
      if (metric === 'tasks')   return d.tasksCompleted > 0;
      return d.habitsCompleted > 0 || d.journalWritten || d.tasksCompleted > 0;
    }).length;
  }, [data, metric]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {METRICS.map((m) => <Skeleton key={m.key} className="h-7 w-16 rounded-full" />)}
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="space-y-4">
      {/* Metric toggle */}
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
              metric === m.key
                ? m.activeClass
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', metric === m.key ? 'bg-white/70' : m.dotClass)} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{totalActive}</span> active days in the last 91 days
      </p>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: `24px repeat(${weeks.length}, 1fr)`, gap: '3px' }}
          >
            <div />
            {monthLabels.map((ml) => (
              <div
                key={`${ml.label}-${ml.colStart}`}
                className="text-[10px] text-muted-foreground font-semibold"
                style={{ gridColumnStart: ml.colStart + 1 }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          {/* Heatmap + day labels */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DAY_ABBRS.map((abbr, i) => (
                <div key={i} className="h-[14px] w-[24px] flex items-center">
                  <span className="text-[9px] text-muted-foreground leading-none">{abbr}</span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, di) => {
                    const tipParts: string[] = [cell.date];
                    if (!cell.tooEarly && cell.day) {
                      if (metric === 'habits' || metric === 'overall') {
                        tipParts.push(`${cell.day.habitsCompleted}/${cell.day.habitsScheduled} habits`);
                      }
                      if (metric === 'journal' || metric === 'overall') {
                        if (cell.day.journalWritten) tipParts.push('journal ✓');
                      }
                      if (metric === 'tasks' || metric === 'overall') {
                        if (cell.day.tasksCompleted > 0) tipParts.push(`${cell.day.tasksCompleted} tasks`);
                      }
                    }
                    return (
                      <button
                        key={`${wi}-${di}`}
                        type="button"
                        title={cell.tooEarly ? '' : tipParts.join(' · ')}
                        aria-label={cell.tooEarly ? '' : tipParts.join(', ')}
                        onClick={() => {
                          if (!cell.tooEarly && onSelectDate) {
                            onSelectDate(parseISO(cell.date));
                          }
                        }}
                        className={cn(
                          'h-[14px] w-[14px] rounded-[3px] transition-all duration-100',
                          'hover:scale-125 hover:brightness-110',
                          cell.tooEarly ? 'cursor-default' : 'cursor-pointer',
                          cellColorClass(cell.day, metric, cell.tooEarly),
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0, 1, 2, 3, 4].map((i) => {
          const scales: Record<HeatMetric, string[]> = {
            habits:  HABIT_SCALE,
            journal: [...JOURNAL_SCALE, ...JOURNAL_SCALE, ...JOURNAL_SCALE],
            tasks:   [...TASKS_SCALE, ...TASKS_SCALE],
            overall: OVERALL_SCALE,
          };
          const scale = scales[metric];
          return (
            <span
              key={i}
              className={cn('h-[14px] w-[14px] rounded-[3px]', scale[Math.min(i, scale.length - 1)])}
            />
          );
        })}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
