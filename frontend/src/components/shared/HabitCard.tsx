'use client';

import { motion } from 'framer-motion';
import { Check, Flame, MoreHorizontal, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Habit } from '@shared/types/api.types';

interface HabitCardProps {
  habit:      Habit;
  completed?: boolean;
  onCheck?:   (habit: Habit, completed: boolean) => void;
  onEdit?:    (habit: Habit) => void;
  onArchive?: (habit: Habit) => void;
  onDelete?:  (habit: Habit) => void;
  loading?:   boolean;
  className?: string;
}

export function HabitCard({
  habit, completed = false, onCheck, onEdit, onArchive, onDelete, loading, className,
}: HabitCardProps) {
  const accentColor = habit.color ?? 'hsl(var(--primary))';

  function handleCheck() {
    if (loading) return;
    onCheck?.(habit, !completed);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        'group flex items-center gap-3.5 rounded-xl border border-border bg-card p-3.5',
        'transition-all duration-150',
        !completed && 'hover:border-border/80 hover:shadow-sm',
        completed && 'opacity-70',
        className,
      )}
    >
      {/* Completion button */}
      <button
        onClick={handleCheck}
        disabled={loading}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        aria-pressed={completed}
        className={cn(
          'flex-none flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          completed
            ? 'scale-105'
            : 'border-border/70 hover:border-primary/60 hover:bg-primary/5',
          loading && 'opacity-40 cursor-wait',
        )}
        style={
          completed
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : undefined
        }
      >
        {completed ? (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 28 }}
          >
            <Check className="h-4 w-4 text-white" />
          </motion.div>
        ) : (
          <span
            className="h-[10px] w-[10px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {habit.icon && (
            <span className="text-base leading-none select-none" aria-hidden>
              {habit.icon}
            </span>
          )}
          <span
            className={cn(
              'text-sm font-medium truncate transition-colors',
              completed ? 'line-through text-muted-foreground' : 'text-foreground',
            )}
          >
            {habit.title}
          </span>
        </div>
        {habit.description && !completed && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
            {habit.description}
          </p>
        )}
      </div>

      {/* Streak */}
      {habit.currentStreak > 0 && (
        <div className="flex items-center gap-1 text-amber-500 shrink-0">
          <Flame className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold tabular-nums">{habit.currentStreak}</span>
        </div>
      )}

      {/* Category badge */}
      {habit.category && (
        <Badge variant="secondary" className="shrink-0 hidden sm:flex text-xs">
          {habit.category.name}
        </Badge>
      )}

      {/* Context menu */}
      {(onEdit || onArchive || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex-none p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Options</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(habit)}>Edit habit</DropdownMenuItem>
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
                  Delete habit
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}
