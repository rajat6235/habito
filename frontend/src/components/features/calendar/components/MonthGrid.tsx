'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, isSameMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@shared/types/api.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function habitBg(pct: number, scheduled: number): string {
  if (scheduled === 0) return '';
  if (pct === 100) return 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]';
  if (pct >= 75)   return 'bg-violet-500/[0.07] dark:bg-violet-500/[0.10]';
  if (pct >= 50)   return 'bg-violet-500/[0.05] dark:bg-violet-500/[0.08]';
  if (pct >= 25)   return 'bg-amber-500/[0.06] dark:bg-amber-500/[0.09]';
  if (pct > 0)     return 'bg-rose-500/[0.04] dark:bg-rose-500/[0.07]';
  return '';
}

function habitDotColor(pct: number, scheduled: number): string | null {
  if (scheduled === 0) return null;
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 50)   return 'bg-violet-500';
  if (pct > 0)     return 'bg-amber-400';
  return 'bg-rose-400/60';
}

function moodEmoji(morning: number | null, evening: number | null): string | null {
  const mood = morning ?? evening;
  if (mood == null) return null;
  if (mood >= 9)  return '🤩';
  if (mood >= 7)  return '😊';
  if (mood >= 5)  return '😐';
  if (mood >= 3)  return '😕';
  return '😞';
}

// ── Day cell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  date:     Date;
  calDay:   CalendarDay | undefined;
  selected: boolean;
  inMonth:  boolean;
  onClick:  () => void;
}

function DayCell({ date, calDay, selected, inMonth, onClick }: DayCellProps) {
  const today      = isToday(date);
  const pct        = calDay?.habitCompletionPct ?? 0;
  const scheduled  = calDay?.habitsScheduled    ?? 0;
  const completed  = calDay?.habitsCompleted    ?? 0;
  const habitColor = habitDotColor(pct, scheduled);
  const bg         = habitBg(pct, scheduled);
  const mood       = calDay ? moodEmoji(calDay.moodMorning, calDay.moodEvening) : null;
  const hasJournal = calDay?.journalWritten ?? false;
  const hasTasks   = (calDay?.tasksCompleted ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${format(date, 'MMMM d')}${calDay ? `, ${completed}/${scheduled} habits` : ''}`}
      className={cn(
        'group relative flex flex-col rounded-xl p-1.5 transition-all duration-150 cursor-pointer',
        'min-h-[4.5rem] sm:min-h-[6rem]',
        'hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        bg,
        selected && 'ring-1 ring-primary/60 bg-primary/[0.06] dark:bg-primary/[0.10]',
        !inMonth  && 'opacity-25',
      )}
    >
      {/* Date number */}
      <span
        className={cn(
          'self-start flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
          today    && 'bg-primary text-primary-foreground',
          selected && !today && 'text-primary font-bold',
          !today && !selected && 'text-foreground',
        )}
      >
        {format(date, 'd')}
      </span>

      {/* Mood + completion fraction — center of cell */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-0.5">
        {mood && (
          <span className="text-[13px] leading-none">{mood}</span>
        )}
        {scheduled > 0 && (
          <span className={cn(
            'text-[9px] font-semibold tabular-nums leading-none',
            pct === 100 ? 'text-emerald-600 dark:text-emerald-400' :
            pct >= 50   ? 'text-violet-600 dark:text-violet-400' :
                          'text-muted-foreground',
          )}>
            {completed}/{scheduled}
          </span>
        )}
      </div>

      {/* Activity dots */}
      <div className="flex items-center gap-0.5 self-start">
        {habitColor && (
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', habitColor)} />
        )}
        {hasJournal && (
          <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-blue-500" />
        )}
        {hasTasks && (
          <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-orange-400" />
        )}
      </div>
    </button>
  );
}

// ── MonthGrid ─────────────────────────────────────────────────────────────────

interface MonthGridProps {
  month:        Date;
  days:         CalendarDay[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({ month, days, selectedDate, onSelectDate }: MonthGridProps) {
  const dayMap = useMemo(
    () => new Map(days.map((d) => [d.date, d])),
    [days],
  );

  const cells = useMemo(() => {
    const start   = startOfMonth(month);
    const end     = endOfMonth(month);
    const allDays = eachDayOfInterval({ start, end });

    const leadingBlanks = getDay(start);
    const blanks = Array.from({ length: leadingBlanks }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (leadingBlanks - i));
      return d;
    });

    return [...blanks, ...allDays];
  }, [month]);

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label[0]}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <motion.div
        key={format(month, 'yyyy-MM')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
        className="grid grid-cols-7 gap-1"
      >
        {cells.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          return (
            <DayCell
              key={dateStr}
              date={date}
              calDay={dayMap.get(dateStr)}
              selected={selectedDate ? isSameDay(date, selectedDate) : false}
              inMonth={isSameMonth(date, month)}
              onClick={() => onSelectDate(date)}
            />
          );
        })}
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-4 px-1">
        {[
          { color: 'bg-emerald-500', label: 'All done' },
          { color: 'bg-violet-500',  label: '50%+ habits' },
          { color: 'bg-amber-400',   label: 'Some habits' },
          { color: 'bg-blue-500',    label: 'Journal' },
          { color: 'bg-orange-400',  label: 'Tasks' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full shrink-0', color)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
