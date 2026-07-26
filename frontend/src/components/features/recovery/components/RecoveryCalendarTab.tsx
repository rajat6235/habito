'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRelapseHistory } from '@/hooks/api/useRecovery';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { buildStreakSegments, getRecoveryDayInfo, type RecoveryDayInfo } from '../utils/timeline';
import { RecoveryDayDetailDialog } from './RecoveryDayDetailDialog';
import type { RecoveryGoal } from '@/lib/api/recovery.api';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

interface RecoveryCalendarTabProps {
  goal: RecoveryGoal;
}

export function RecoveryCalendarTab({ goal }: RecoveryCalendarTabProps) {
  const { data: relapses, isLoading } = useRelapseHistory(goal.id);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const goalStart      = useMemo(() => new Date(goal.startDate), [goal.startDate]);
  const goalStartMonth = useMemo(() => startOfMonth(goalStart), [goalStart]);
  const segments        = useMemo(
    () => (relapses ? buildStreakSegments(goal, relapses) : []),
    [goal, relapses],
  );

  const days      = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const firstDow  = startOfMonth(monthDate).getDay();
  const today     = new Date();
  const isAtStartMonth = isSameDay(startOfMonth(monthDate), goalStartMonth) || isBefore(startOfMonth(monthDate), goalStartMonth);

  const selectedInfo: RecoveryDayInfo | null = selectedDay ? getRecoveryDayInfo(selectedDay, goal, segments) : null;

  function prev() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function next() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  if (isLoading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prev} disabled={isAtStartMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium" aria-live="polite">{format(monthDate, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="icon" onClick={next} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1" aria-hidden>
        {DAY_HEADERS.map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={format(monthDate, 'MMMM yyyy')}>
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} role="gridcell" aria-hidden />
        ))}
        {days.map(day => {
          const key  = format(day, 'yyyy-MM-dd');
          const info = getRecoveryDayInfo(day, goal, segments);
          const isToday  = isSameDay(day, today);
          const isFuture = day > today;

          const ariaLabel = info.status === 'relapse' ? `${format(day, 'MMMM d')}: relapse`
            : info.status === 'milestone' ? `${format(day, 'MMMM d')}: milestone, day ${info.dayNumber}`
            : info.status === 'recovery'  ? `${format(day, 'MMMM d')}: day ${info.dayNumber}`
            : format(day, 'MMMM d');

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-label={ariaLabel}
              disabled={isFuture || info.status === 'before-start'}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors',
                isToday && 'ring-2 ring-primary ring-offset-1',
                info.status === 'relapse'    && 'bg-rose-400 text-white hover:bg-rose-500',
                info.status === 'recovery'   && 'bg-emerald-500 text-white hover:bg-emerald-600',
                info.status === 'milestone'  && 'bg-amber-400 text-white hover:bg-amber-500',
                info.status === 'before-start' && 'text-muted-foreground/30 cursor-default',
                isFuture && 'text-muted-foreground/30 cursor-default',
                !info.status && !isFuture && 'text-muted-foreground hover:bg-muted',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1" aria-label="Legend">
        {[
          ['bg-emerald-500', 'Recovery day'],
          ['bg-rose-400',    'Relapse'],
          ['bg-amber-400',   'Milestone'],
          ['bg-muted-foreground/30', 'Before start'],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', c)} aria-hidden />
            {l}
          </span>
        ))}
      </div>

      <RecoveryDayDetailDialog day={selectedDay} info={selectedInfo} onClose={() => setSelectedDay(null)} />
    </div>
  );
}
