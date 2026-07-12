'use client';

import { useMemo, useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarHeatmap } from '@/hooks/api/useCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarDay } from '@shared/types/api.types';

// ── Metric toggle ──────────────────────────────────────────────────────────────

type HeatMetric = 'habits' | 'journal' | 'tasks' | 'overall';

const METRICS: { key: HeatMetric; label: string; color: string }[] = [
  { key: 'habits',  label: 'Habits',  color: 'bg-violet-500' },
  { key: 'journal', label: 'Journal', color: 'bg-blue-500'   },
  { key: 'tasks',   label: 'Tasks',   color: 'bg-orange-400' },
  { key: 'overall', label: 'Overall', color: 'bg-emerald-500'},
];

// ── Color calculation ─────────────────────────────────────────────────────────

function cellColor(day: CalendarDay | undefined, metric: HeatMetric, isEmpty: boolean): string {
  if (isEmpty || !day) return 'bg-muted/40';

  switch (metric) {
    case 'habits': {
      const pct = day.habitCompletionPct;
      if (day.habitsScheduled === 0) return 'bg-muted/40';
      if (pct === 100) return 'bg-emerald-500';
      if (pct >= 75)   return 'bg-violet-500';
      if (pct >= 50)   return 'bg-violet-400/70';
      if (pct >= 25)   return 'bg-violet-300/60';
      return 'bg-violet-200/50 dark:bg-violet-800/40';
    }
    case 'journal':
      return day.journalWritten ? 'bg-blue-500' : 'bg-muted/40';
    case 'tasks': {
      const done = day.tasksCompleted;
      const sched = day.tasksScheduled;
      if (sched === 0) return 'bg-muted/40';
      if (done === sched) return 'bg-orange-500';
      if (done > 0)    return 'bg-orange-400/70';
      return 'bg-orange-200/50 dark:bg-orange-800/40';
    }
    case 'overall': {
      const score = (
        (day.habitsScheduled > 0 ? day.habitCompletionPct / 100 : 0) +
        (day.journalWritten ? 1 : 0) +
        (day.tasksScheduled > 0 ? (day.tasksCompleted / day.tasksScheduled) : 0)
      ) / 3;
      if (score >= 0.9) return 'bg-emerald-500';
      if (score >= 0.6) return 'bg-violet-500';
      if (score >= 0.3) return 'bg-violet-400/70';
      if (score >  0)   return 'bg-amber-400/60';
      return 'bg-muted/40';
    }
  }
}

// ── Grid builder (same pattern as StatsTab.buildHeatGrid) ─────────────────────

function buildGrid(days: CalendarDay[], daysBack: number) {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMap    = new Map(days.map((d) => [d.date, d]));
  const earliest  = subDays(today, daysBack - 1);
  const offset    = earliest.getDay();
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

// ── Month labels ──────────────────────────────────────────────────────────────

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

  const weeks = useMemo(() => buildGrid(data, 91), [data]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-1">
          {METRICS.map((m) => <Skeleton key={m.key} className="h-7 w-16 rounded-full" />)}
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const metricColor = METRICS.find((m) => m.key === metric)?.color ?? 'bg-emerald-500';

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
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
              metric === m.key
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', m.color)} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: `20px repeat(${weeks.length}, 1fr)`, gap: '2px' }}
          >
            <div />
            {monthLabels.map((ml) => (
              <div
                key={`${ml.label}-${ml.colStart}`}
                className="text-[10px] text-muted-foreground font-medium"
                style={{ gridColumnStart: ml.colStart + 1 }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          {/* Heatmap + day labels */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_ABBRS.map((abbr, i) => (
                <div key={i} className="h-[10px] w-[20px] flex items-center">
                  <span className="text-[9px] text-muted-foreground">{abbr}</span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((cell, di) => (
                    <button
                      key={`${wi}-${di}`}
                      type="button"
                      title={cell.tooEarly ? '' : `${cell.date}${cell.day ? ` · ${cell.day.habitsCompleted}/${cell.day.habitsScheduled} habits` : ''}`}
                      onClick={() => {
                        if (!cell.tooEarly && onSelectDate) {
                          onSelectDate(parseISO(cell.date));
                        }
                      }}
                      className={cn(
                        'h-[10px] w-[10px] rounded-[2px] transition-transform hover:scale-125',
                        cellColor(cell.day, metric, cell.tooEarly),
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {['bg-muted/40', 'bg-opacity-40', 'bg-opacity-60', 'bg-opacity-80', ''].map((_, i) => {
          const intensities = ['bg-muted/40', `${metricColor}/30`, `${metricColor}/60`, metricColor, metricColor];
          return (
            <span key={i} className={cn('h-[10px] w-[10px] rounded-[2px]', intensities[i])} />
          );
        })}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
