'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, isSameMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@shared/types/api.types';

// ── Constants ──��──────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ── Dot helpers ───────────��───────────────────────────────────────────────────

function habitDotColor(pct: number, scheduled: number): string | null {
  if (scheduled === 0) return null;
  if (pct === 100)  return 'bg-emerald-500';
  if (pct >= 50)    return 'bg-violet-500';
  if (pct > 0)      return 'bg-amber-400';
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

// ── Day cell ───────────────────────────────────────────��──────────────────────

interface DayCellProps {
  date:     Date;
  calDay:   CalendarDay | undefined;
  selected: boolean;
  inMonth:  boolean;
  onClick:  () => void;
}

function DayCell({ date, calDay, selected, inMonth, onClick }: DayCellProps) {
  const today      = isToday(date);
  const habitColor = calDay ? habitDotColor(calDay.habitCompletionPct, calDay.habitsScheduled) : null;
  const mood       = calDay ? moodEmoji(calDay.moodMorning, calDay.moodEvening) : null;
  const hasJournal = calDay?.journalWritten ?? false;
  const hasTasks   = (calDay?.tasksCompleted ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center rounded-xl p-1.5 sm:p-2 transition-all duration-150',
        'min-h-[3.5rem] sm:min-h-[4.5rem] hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'bg-primary/10 ring-1 ring-primary/40',
        !inMonth  && 'opacity-30',
      )}
    >
      {/* Date number */}
      <span
        className={cn(
          'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-semibold',
          today    && 'bg-primary text-primary-foreground',
          selected && !today && 'text-primary font-bold',
          !today   && !selected && 'text-foreground',
        )}
      >
        {format(date, 'd')}
      </span>

      {/* Mood emoji — tiny */}
      {mood && (
        <span className="text-[11px] leading-none mt-0.5 hidden sm:block">{mood}</span>
      )}

      {/* Activity dots row */}
      <div className="flex items-center gap-0.5 mt-auto pt-1">
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

// ── MonthGrid ─────────��─────────────────────────���─────────────────────────────

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

    // Pad leading cells for the first week (Sun=0)
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
            className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1.5"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <motion.div
        key={format(month, 'yyyy-MM')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
        className="grid grid-cols-7 gap-px"
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 px-1">
        {[
          { color: 'bg-emerald-500', label: 'All habits done' },
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
