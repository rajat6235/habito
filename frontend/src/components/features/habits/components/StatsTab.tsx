'use client';

import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useHabitStats } from '@/hooks/api/useHabits';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NUMERIC_FIELD_TYPES, type CustomFieldDef, type CustomFieldAggregate } from '@shared/types/customFields';

// ── Types ──────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface StatsTabProps {
  habitId:       string;
  customFields?: CustomFieldDef[];
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

type HeatStatus = 'completed' | 'failed' | 'skipped' | null;

function heatColor(status: HeatStatus): string {
  switch (status) {
    case 'completed': return 'bg-violet-500';
    case 'failed':    return 'bg-red-400/70';
    case 'skipped':   return 'bg-amber-400/60';
    default:          return 'bg-muted';
  }
}

function buildHeatGrid(
  heatmap: { date: string; status: string | null }[],
  daysBack = 91,
): { date: string; status: HeatStatus; dayOfWeek: number }[][] {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const statusMap = new Map(heatmap.map(h => [h.date, h.status as HeatStatus]));

  // Start grid on the Sunday on or before (today - daysBack)
  const earliest    = subDays(today, daysBack - 1);
  const startOffset = earliest.getDay(); // 0=Sun
  const startDate   = subDays(earliest, startOffset);

  const weeks: { date: string; status: HeatStatus; dayOfWeek: number }[][] = [];
  let week: typeof weeks[0] = [];

  let cursor = new Date(startDate);
  while (cursor <= today) {
    const iso = format(cursor, 'yyyy-MM-dd');
    const tooEarly = cursor < earliest;
    week.push({
      date:      iso,
      status:    tooEarly ? null : (statusMap.get(iso) ?? null),
      dayOfWeek: cursor.getDay(),
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  if (week.length) weeks.push(week);
  return weeks;
}

// ── Milestones ────────────────────────────────────────────────────────────────

interface Milestone { emoji: string; label: string; unlocked: boolean }

function computeMilestones(
  currentStreak:    number,
  longestStreak:    number,
  totalCompletions: number,
): Milestone[] {
  const milestones: Milestone[] = [];

  const streakGoals = [3, 7, 14, 21, 30, 60, 90, 180, 365];
  for (const g of streakGoals) {
    milestones.push({
      emoji:    g >= 90 ? '🏆' : g >= 30 ? '🥇' : g >= 14 ? '🥈' : '🔥',
      label:    `${g}-day streak`,
      unlocked: longestStreak >= g || currentStreak >= g,
    });
  }

  const completionGoals = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
  for (const g of completionGoals) {
    milestones.push({
      emoji:    g >= 500 ? '💎' : g >= 100 ? '⭐' : g >= 25 ? '🎯' : '✅',
      label:    `${g} completion${g > 1 ? 's' : ''}`,
      unlocked: totalCompletions >= g,
    });
  }

  return milestones;
}

// ── Custom field analytics ────────────────────────────────────────────────────

function computeFieldAnalytics(
  heatmap: { date: string; status: string | null; customFieldValues: Record<string, unknown> }[],
  fields: CustomFieldDef[],
): CustomFieldAggregate[] {
  const analyticsFields = fields.filter(
    f => f.includeInAnalytics && NUMERIC_FIELD_TYPES.includes(f.type),
  );
  if (analyticsFields.length === 0) return [];

  const completedLogs = heatmap.filter(l => l.status === 'completed');

  return analyticsFields.map(field => {
    const entries: { date: string; value: number }[] = [];
    for (const log of completedLogs) {
      const raw = log.customFieldValues?.[field.id];
      if (raw !== undefined && raw !== null && raw !== '') {
        const num = Number(raw);
        if (!isNaN(num)) entries.push({ date: log.date, value: num });
      }
    }
    if (entries.length === 0) {
      return { fieldId: field.id, fieldName: field.name, type: field.type, count: 0, total: 0, average: 0, min: 0, max: 0, trend: [] };
    }
    const values = entries.map(e => e.value);
    const total  = values.reduce((s, v) => s + v, 0);
    const trend  = entries.slice(-30).sort((a, b) => a.date.localeCompare(b.date));
    return {
      fieldId: field.id, fieldName: field.name, type: field.type,
      count: entries.length, total,
      average: Math.round((total / entries.length) * 10) / 10,
      min: Math.min(...values), max: Math.max(...values),
      trend,
    };
  }).filter(a => a.count > 0);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatsTab({ habitId, customFields = [] }: StatsTabProps) {
  const { data, isLoading } = useHabitStats(habitId);

  const heatGrid   = useMemo(() => buildHeatGrid(data?.heatmap ?? [], 91), [data?.heatmap]);
  const milestones = useMemo(
    () => computeMilestones(data?.currentStreak ?? 0, data?.longestStreak ?? 0, data?.totalCompletions ?? 0),
    [data?.currentStreak, data?.longestStreak, data?.totalCompletions],
  );
  const unlockedCount = milestones.filter(m => m.unlocked).length;

  const fieldAnalytics = useMemo(() => {
    if (!data?.heatmap) return [];
    return computeFieldAnalytics(data.heatmap, customFields);
  }, [data?.heatmap, customFields]);

  // Week-over-week comparison
  const wowDelta = useMemo(() => {
    if (!data) return null;
    const diff = data.last7Days - (data.last30Days > 0 ? Math.round(data.last30Days / 4) : 0);
    return diff;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading stats">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground">No stats available.</p>;

  const maxRate = Math.max(...data.byDayOfWeek.map(d => d.rate), 1);

  return (
    <div className="space-y-6">

      {/* ── Key stats ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Current Streak', value: `${data.currentStreak}d`, sub: `Best: ${data.longestStreak}d`, color: 'text-amber-500' },
          { label: 'Total Done',     value: data.totalCompletions,    sub: `${data.successRate}% success`,  color: 'text-emerald-500' },
          { label: 'Last 7 Days',    value: `${data.last7Days}×`,
            sub: wowDelta != null && wowDelta !== 0
              ? `${wowDelta > 0 ? '+' : ''}${wowDelta} vs avg week`
              : 'vs monthly average',
            trend: wowDelta,
            color: 'text-primary' },
          { label: 'Last 30 Days',   value: `${data.last30Days}×`,   sub: 'completions',                    color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <div className="flex items-end justify-between gap-1">
              <p className={cn('text-2xl font-black tabular-nums leading-none', s.color)}>{s.value}</p>
              {'trend' in s && s.trend != null && s.trend !== 0 && (
                <span className={cn('text-xs font-medium', s.trend > 0 ? 'text-emerald-500' : 'text-red-400')}>
                  {s.trend > 0 ? <TrendingUp className="h-3.5 w-3.5 inline" /> : <TrendingDown className="h-3.5 w-3.5 inline" />}
                </span>
              )}
              {'trend' in s && s.trend === 0 && (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 90-Day Heatmap ── */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          90-Day Activity
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-px min-w-0" role="img" aria-label="90-day activity heatmap">
            {heatGrid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-px">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date ? `${day.date}${day.status ? ' · ' + day.status : ''}` : undefined}
                    className={cn(
                      'h-[9px] w-[9px] rounded-[2px] transition-opacity',
                      heatColor(day.status),
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted inline-block" /> None</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-500 inline-block" /> Done</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400/60 inline-block" /> Skipped</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400/70 inline-block" /> Failed</span>
        </div>
      </div>

      {/* ── Day of Week ── */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Best Days
        </p>
        <div className="flex items-end gap-1.5 h-20" role="img" aria-label="Completion rate by day of week">
          {data.byDayOfWeek.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
              {d.rate > 0 && (
                <span className="text-[9px] text-muted-foreground tabular-nums">{d.rate}%</span>
              )}
              <div className="flex-1 flex items-end w-full">
                <div
                  className={cn(
                    'w-full rounded-t min-h-[3px] transition-all',
                    d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 50 ? 'bg-primary/70' : 'bg-muted-foreground/30',
                  )}
                  style={{ height: `${Math.max(3, Math.round((d.rate / maxRate) * 48))}px` }}
                  aria-label={`${DAY_NAMES[d.day]}: ${d.rate}%`}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{DAY_NAMES[d.day]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Milestones ── */}
      {milestones.some(m => m.unlocked) && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Milestones
            </p>
            <span className="text-[10px] text-muted-foreground">
              {unlockedCount}/{milestones.length} unlocked
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {milestones.filter(m => m.unlocked).map(m => (
              <div
                key={m.label}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium"
              >
                <span aria-hidden>{m.emoji}</span>
                {m.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Field Analytics ── */}
      {fieldAnalytics.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Custom Field Analytics
          </p>
          {fieldAnalytics.map(agg => {
            const trendMax = Math.max(...agg.trend.map(t => t.value), 1);
            return (
              <div key={agg.fieldId} className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{agg.fieldName}</span>
                  <span className="text-[10px] text-muted-foreground">{agg.count} entries</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { label: 'Total', val: agg.total,   color: 'text-foreground' },
                    { label: 'Avg',   val: agg.average, color: 'text-primary' },
                    { label: 'Min',   val: agg.min,     color: 'text-muted-foreground' },
                    { label: 'Max',   val: agg.max,     color: 'text-emerald-500' },
                  ].map(c => (
                    <div key={c.label} className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[9px] text-muted-foreground mb-0.5">{c.label}</p>
                      <p className={cn('text-sm font-bold tabular-nums', c.color)}>{c.val}</p>
                    </div>
                  ))}
                </div>
                {agg.trend.length >= 3 && (
                  <div className="flex items-end gap-px h-10" role="img" aria-label={`${agg.fieldName} trend`}>
                    {agg.trend.map((t, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/50 min-h-[2px]"
                        style={{ height: `${Math.max(2, Math.round((t.value / trendMax) * 36))}px` }}
                        title={`${t.date}: ${t.value}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
