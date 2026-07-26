'use client';

import { motion } from 'framer-motion';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Check, MoreHorizontal, Archive, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Habit } from '@shared/types/api.types';

interface EventHabitCardProps {
  habit:      Habit;
  onLogNow:   (habit: Habit) => void;
  onHistory?: (habit: Habit) => void;
  onEdit?:    (habit: Habit) => void;
  onArchive?: (habit: Habit) => void;
  onDelete?:  (habit: Habit) => void;
  loading?:   boolean;
  className?: string;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.max(0, differenceInCalendarDays(new Date(), parseISO(dateStr)));
}

export function EventHabitCard({
  habit, onLogNow, onHistory, onEdit, onArchive, onDelete, loading, className,
}: EventHabitCardProps) {
  const accentColor = habit.color ?? 'hsl(var(--primary))';
  const since = daysSince(habit.lastCompletedDate);
  const loggedToday = since === 0;

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
        'transition-all duration-200 border-border hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5',
        className,
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
    >
      {onHistory && (
        <button
          onClick={handleCardClick}
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={`View history for ${habit.title}`}
          tabIndex={-1}
        />
      )}

      <div className="flex-1 min-w-0 py-3 pl-3.5 relative z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          {habit.icon && (
            <span className="text-base leading-none select-none shrink-0" aria-hidden>{habit.icon}</span>
          )}
          <span className="text-sm font-semibold truncate text-foreground">{habit.title}</span>
        </div>
        <p className="text-xs mt-0.5 text-muted-foreground">
          {since == null ? 'Never logged' : since === 0 ? 'Done today' : `Last done ${since}d ago`}
        </p>
      </div>

      <div className="flex items-center gap-1 pr-2 shrink-0 relative z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onLogNow(habit); }}
          disabled={loading || loggedToday}
          aria-label={loggedToday ? 'Already logged today' : `Log ${habit.title} now`}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            loggedToday
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95',
            loading && 'opacity-40 cursor-wait',
          )}
        >
          {loggedToday ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
          {loggedToday ? 'Logged' : 'Log now'}
        </button>

        {(onEdit || onHistory || onArchive || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
