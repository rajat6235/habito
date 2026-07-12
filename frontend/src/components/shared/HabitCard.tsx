'use client';

import { motion } from 'framer-motion';
import { Check, Flame, MoreHorizontal, Archive, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

interface HabitCardProps {
  habit:        Habit;
  completed?:   boolean;
  onCheck?:     (habit: Habit, completed: boolean) => void;
  onLog?:       (habit: Habit) => void;
  onHistory?:   (habit: Habit) => void;
  onEdit?:      (habit: Habit) => void;
  onArchive?:   (habit: Habit) => void;
  onDelete?:    (habit: Habit) => void;
  loading?:     boolean;
  className?:   string;
}

function getTimesPerDay(habit: Habit): number {
  const cfg = (habit as HabitWithTodayLog).frequencyConfig as Record<string, unknown>;
  if (!cfg) return 1;
  const type = cfg['type'];
  if (type === 'custom_daily' && typeof cfg['timesPerDay'] === 'number') return cfg['timesPerDay'] as number;
  if (type === 'twice_daily') return 2;
  return 1;
}

function getCompletionCount(habit: Habit): number {
  return ((habit as HabitWithTodayLog).todayLog?.completionCount) ?? 0;
}

export function HabitCard({
  habit, completed = false, onCheck, onLog, onHistory, onEdit, onArchive, onDelete, loading, className,
}: HabitCardProps) {
  const accentColor = habit.color ?? 'hsl(var(--primary))';
  const timesPerDay = getTimesPerDay(habit);
  const countToday  = getCompletionCount(habit);
  const isMultiple  = timesPerDay > 1;
  const isFullyDone = isMultiple ? countToday >= timesPerDay : completed;

  function handleCircleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;
    if (isMultiple && onLog) {
      onLog(habit);
    } else {
      onCheck?.(habit, !completed);
    }
  }

  function handleCardClick() {
    onHistory?.(habit);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        'group relative flex items-center gap-3.5 rounded-xl border bg-card',
        'transition-all duration-200',
        isFullyDone
          ? 'border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]'
          : 'border-border hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5',
        className,
      )}
      style={!isFullyDone ? {
        borderLeftColor: accentColor,
        borderLeftWidth: '3px',
      } : undefined}
    >
      {/* Clickable main area */}
      {onHistory && (
        <button
          onClick={handleCardClick}
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={`View history for ${habit.title}`}
          tabIndex={-1}
        />
      )}

      {/* Left: completion button */}
      <div className="pl-3.5 shrink-0 relative z-10">
        {isMultiple ? (
          <button
            onClick={handleCircleClick}
            disabled={loading || isFullyDone}
            aria-label={`Log ${habit.title} (${countToday}/${timesPerDay})`}
            aria-pressed={isFullyDone}
            className={cn(
              'flex flex-col items-center justify-center h-10 w-10 rounded-full border-2',
              'text-[10px] font-bold leading-none transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isFullyDone
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-border/80 hover:scale-105 hover:border-primary/60 hover:bg-primary/5',
              loading && 'opacity-40 cursor-wait',
            )}
          >
            {isFullyDone ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 25 }}>
                <Check className="h-4 w-4" />
              </motion.div>
            ) : (
              <span className="tabular-nums" style={{ color: accentColor }}>
                {countToday}/{timesPerDay}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={handleCircleClick}
            disabled={loading}
            aria-label={isFullyDone ? 'Mark incomplete' : 'Mark complete'}
            aria-pressed={isFullyDone}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border-2',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isFullyDone
                ? 'scale-100 border-emerald-500 bg-emerald-500'
                : 'border-border/70 hover:scale-105 hover:border-primary/60 hover:bg-primary/5',
              loading && 'opacity-40 cursor-wait',
            )}
          >
            {isFullyDone ? (
              <motion.div
                key="done"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 22 }}
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            ) : (
              <motion.span
                className="h-3 w-3 rounded-full opacity-0 group-hover:opacity-80 transition-opacity"
                style={{ backgroundColor: accentColor }}
                aria-hidden
              />
            )}
          </button>
        )}
      </div>

      {/* Center: content */}
      <div className="flex-1 min-w-0 py-3 relative z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          {habit.icon && (
            <span className="text-base leading-none select-none shrink-0" aria-hidden>
              {habit.icon}
            </span>
          )}
          <span
            className={cn(
              'text-sm font-semibold truncate transition-colors',
              isFullyDone ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {habit.title}
          </span>
        </div>

        {habit.description && (
          <p className={cn(
            'text-xs truncate mt-0.5 leading-relaxed transition-colors',
            isFullyDone ? 'text-muted-foreground/50' : 'text-muted-foreground',
          )}>
            {habit.description}
          </p>
        )}

        {isMultiple && !isFullyDone && countToday > 0 && (
          <p className="text-[11px] font-medium mt-0.5" style={{ color: accentColor }}>
            {timesPerDay - countToday} more to go
          </p>
        )}
      </div>

      {/* Right: streak + log button + menu */}
      <div className="flex items-center gap-1 pr-2 shrink-0 relative z-10">
        {/* Streak */}
        {(habit.currentStreak ?? 0) > 0 && (
          <div
            className={cn(
              'flex items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
              isFullyDone ? 'text-emerald-500' : 'text-amber-500',
            )}
            title={`${habit.currentStreak}-day streak`}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden />
            <span className="text-xs font-bold tabular-nums">{habit.currentStreak}</span>
          </div>
        )}

        {/* Multi-completion log button */}
        {isMultiple && !isFullyDone && onLog && (
          <button
            onClick={(e) => { e.stopPropagation(); onLog(habit); }}
            disabled={loading}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0',
              'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
              loading && 'opacity-40 cursor-wait',
            )}
          >
            <Plus className="h-3 w-3" aria-hidden />
            Log
          </button>
        )}

        {/* History chevron (touch-friendly hint) */}
        {onHistory && !isMultiple && (
          <div className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </div>
        )}

        {/* Context menu */}
        {(onEdit || onHistory || onArchive || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted',
                  'transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(habit)}>
                  <Pencil className="h-4 w-4" />
                  Edit habit
                </DropdownMenuItem>
              )}
              {onHistory && (
                <DropdownMenuItem onClick={() => onHistory(habit)}>
                  <ChevronRight className="h-4 w-4" />
                  View history
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(habit)}>
                  <Archive className="h-4 w-4" />
                  {habit.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onClick={() => onDelete(habit)}>
                    <Trash2 className="h-4 w-4" />
                    Delete habit
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}
