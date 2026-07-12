'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, addWeeks, subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@shared/types/api.types';

// ── Week card ─────────────────────────────────────────────────────────────────

function habitRingStyle(pct: number, scheduled: number) {
  if (scheduled === 0) return { color: 'hsl(var(--muted-foreground))', opacity: 0.3 };
  if (pct === 100)     return { color: '#10b981', opacity: 1 };
  if (pct >= 50)       return { color: '#6d60f0', opacity: 1 };
  if (pct > 0)         return { color: '#f59e0b', opacity: 1 };
  return { color: 'hsl(var(--muted-foreground))', opacity: 0.5 };
}

function moodEmoji(m: number | null, e: number | null): string {
  const v = m ?? e;
  if (v == null) return '';
  if (v >= 9) return '🤩';
  if (v >= 7) return '😊';
  if (v >= 5) return '😐';
  if (v >= 3) return '😕';
  return '😞';
}

interface WeekDayCardProps {
  date:     Date;
  calDay:   CalendarDay | undefined;
  selected: boolean;
  onClick:  () => void;
}

function WeekDayCard({ date, calDay, selected, onClick }: WeekDayCardProps) {
  const today      = isToday(date);
  const pct        = calDay?.habitCompletionPct ?? 0;
  const scheduled  = calDay?.habitsScheduled    ?? 0;
  const { color }  = habitRingStyle(pct, scheduled);
  const mood       = moodEmoji(calDay?.moodMorning ?? null, calDay?.moodEvening ?? null);
  const hasJournal = calDay?.journalWritten ?? false;
  const hasTasks   = (calDay?.tasksCompleted ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-150',
        'hover:shadow-sm hover:border-border/80',
        today    && 'border-primary/40 bg-primary/[0.03]',
        selected && !today && 'border-primary/30 bg-primary/[0.05] ring-1 ring-primary/20',
        !today && !selected && 'border-border bg-card',
      )}
    >
      {/* Weekday */}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {format(date, 'EEE')}
      </span>

      {/* Date number */}
      <span className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
        today && 'bg-primary text-primary-foreground',
      )}>
        {format(date, 'd')}
      </span>

      {/* Habit ring — mini SVG */}
      <div className="relative h-8 w-8">
        <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx="16" cy="16" r="12" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <motion.circle
            cx="16" cy="16" r="12" fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 12}
            initial={{ strokeDashoffset: 2 * Math.PI * 12 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 12 * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          />
        </svg>
        {mood ? (
          <span className="absolute inset-0 flex items-center justify-center text-[11px]">{mood}</span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground tabular-nums">
            {scheduled > 0 ? `${pct}%` : ''}
          </span>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center gap-0.5 h-2">
        {hasJournal && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
        {hasTasks   && <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
      </div>
    </button>
  );
}

// ── WeekStrip ─────────────────────────────────────────────────────────────────

interface WeekStripProps {
  anchor:       Date;
  onAnchorChange: (d: Date) => void;
  days:         CalendarDay[];
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}

export function WeekStrip({ anchor, onAnchorChange, days, selectedDate, onSelectDate }: WeekStripProps) {
  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 0 });
    const end   = endOfWeek(anchor,   { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  const rangeLabel = `${format(weekDays[0]!, 'MMM d')} – ${format(weekDays[6]!, 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onAnchorChange(subWeeks(anchor, 1))}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{rangeLabel}</span>
        <button
          type="button"
          onClick={() => onAnchorChange(addWeeks(anchor, 1))}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 7-day cards */}
      <motion.div
        key={format(anchor, 'yyyy-ww')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-7 gap-1.5"
      >
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          return (
            <WeekDayCard
              key={dateStr}
              date={date}
              calDay={dayMap.get(dateStr)}
              selected={selectedDate ? isSameDay(date, selectedDate) : false}
              onClick={() => onSelectDate(date)}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
