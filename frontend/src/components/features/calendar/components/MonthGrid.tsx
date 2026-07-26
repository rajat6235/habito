'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, isSameMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { DayCellData } from '../dayEvents';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const RING_R = 11;
const RING_C = 2 * Math.PI * RING_R;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number | null, notable: DayCellData['notable']): string {
  if (notable === 'relapse') return '#f43f5e';
  if (score == null) return 'transparent';
  if (score >= 85) return '#10b981';
  if (score >= 50) return '#6d60f0';
  if (score >= 20) return '#f59e0b';
  return 'hsl(var(--muted-foreground))';
}

function headlineClass(notable: DayCellData['notable']): string {
  if (notable === 'relapse')   return 'text-rose-600 dark:text-rose-400 font-bold';
  if (notable === 'milestone') return 'text-amber-600 dark:text-amber-400 font-bold';
  if (notable === 'perfect')   return 'text-emerald-600 dark:text-emerald-400 font-bold';
  return 'text-muted-foreground';
}

function fillClass(notable: DayCellData['notable']): string {
  if (notable === 'relapse')   return 'bg-rose-500/[0.10] dark:bg-rose-500/[0.14]';
  if (notable === 'milestone') return 'bg-amber-500/[0.10] dark:bg-amber-500/[0.15]';
  if (notable === 'perfect')   return 'bg-emerald-500/[0.10] dark:bg-emerald-500/[0.14]';
  return '';
}

// ── Day cell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  date:     Date;
  cell:     DayCellData | undefined;
  selected: boolean;
  inMonth:  boolean;
  onClick:  () => void;
}

function DayCell({ date, cell, selected, inMonth, onClick }: DayCellProps) {
  const today    = isToday(date);
  const score    = cell?.score ?? null;
  const headline = cell?.headline ?? null;
  const notable  = cell?.notable ?? null;
  const ring     = scoreColor(score, notable);
  const dashoffset = score != null ? RING_C * (1 - score / 100) : RING_C;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${format(date, 'MMMM d')}${headline ? `, ${headline}` : ''}`}
      className={cn(
        'group relative flex flex-col rounded-xl p-1.5 gap-1 text-left transition-all duration-150 cursor-pointer',
        'min-h-[4.5rem] sm:min-h-[6rem]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        fillClass(notable) || 'hover:bg-muted/70',
        selected && 'ring-1 ring-primary/60',
        today && 'ring-1 ring-primary/70',
        !inMonth && 'opacity-30',
      )}
    >
      <div className="relative h-7 w-7 shrink-0">
        <svg width="28" height="28" className="-rotate-90">
          <circle cx="14" cy="14" r={RING_R} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground/15" />
          {score != null && (
            <circle
              cx="14" cy="14" r={RING_R} fill="none" stroke={ring} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          )}
        </svg>
        <span className={cn(
          'absolute inset-0 flex items-center justify-center text-[10.5px] font-bold tabular-nums',
          today ? 'text-primary' : 'text-foreground',
        )}>
          {format(date, 'd')}
        </span>
      </div>

      {headline && (
        <p className={cn('text-[10px] leading-tight truncate mt-auto', headlineClass(notable))}>
          {headline}
        </p>
      )}
    </button>
  );
}

// ── MonthGrid ─────────────────────────────────────────────────────────────────

interface MonthGridProps {
  month:        Date;
  cellData:     Map<string, DayCellData>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({ month, cellData, selectedDate, onSelectDate }: MonthGridProps) {
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
              cell={cellData.get(dateStr)}
              selected={selectedDate ? isSameDay(date, selectedDate) : false}
              inMonth={isSameMonth(date, month)}
              onClick={() => onSelectDate(date)}
            />
          );
        })}
      </motion.div>

      {/* Legend — only the states that need explaining; everything else is just words */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500/20 border border-emerald-500 shrink-0" />
          <span className="text-[10px] text-muted-foreground">Perfect day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500/20 border border-amber-500 shrink-0" />
          <span className="text-[10px] text-muted-foreground">Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-rose-500/20 border border-rose-500 shrink-0" />
          <span className="text-[10px] text-muted-foreground">Relapse</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">Everything else — read the words</span>
      </div>
    </div>
  );
}
