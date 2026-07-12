'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabitLogsRange } from '@/hooks/api/useHabits';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HabitLog } from '@shared/types/api.types';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

interface CalendarTabProps {
  habitId: string;
}

export function CalendarTab({ habitId }: CalendarTabProps) {
  const [monthDate, setMonthDate] = useState(() => new Date());

  const from = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const to   = format(endOfMonth(monthDate),   'yyyy-MM-dd');

  const { data, isLoading } = useHabitLogsRange(habitId, from, to);

  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog>();
    (data?.data ?? []).forEach(l => map.set(l.logDate, l));
    return map;
  }, [data]);

  const days      = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const firstDow  = startOfMonth(monthDate).getDay();
  const today     = new Date();

  function prev() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function next() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium" aria-live="polite">
          {format(monthDate, 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" onClick={next} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1" aria-hidden>
        {DAY_HEADERS.map(d => <span key={d}>{d}</span>)}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={format(monthDate, 'MMMM yyyy')}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} role="gridcell" aria-hidden />
          ))}
          {days.map(day => {
            const key       = format(day, 'yyyy-MM-dd');
            const log       = logsByDate.get(key);
            const isToday   = isSameDay(day, today);
            const isFuture  = day > today;
            const ariaLabel = log
              ? `${format(day, 'MMMM d')}: ${log.status}${log.note ? ` — ${log.note}` : ''}`
              : format(day, 'MMMM d');

            return (
              <div
                key={key}
                role="gridcell"
                aria-label={ariaLabel}
                title={log ? `${log.status}${log.note ? ` — ${log.note}` : ''}` : undefined}
                className={cn(
                  'aspect-square rounded-md flex items-center justify-center text-xs font-medium',
                  isToday && 'ring-2 ring-primary ring-offset-1',
                  log?.status === 'completed' && 'bg-emerald-500 text-white',
                  log?.status === 'skipped'   && 'bg-amber-400 text-white',
                  log?.status === 'failed'    && 'bg-rose-400 text-white',
                  isFuture && !log && 'text-muted-foreground/30',
                  !log && !isFuture && 'text-muted-foreground hover:bg-muted transition-colors',
                )}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1" aria-label="Legend">
        {[
          ['bg-emerald-500', 'Completed'],
          ['bg-amber-400',   'Skipped'],
          ['bg-rose-400',    'Failed'],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', c)} aria-hidden />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
