'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, CheckSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTodayHabits, useHabits, useLogHabit, useCreateHabit, useHabitCategories } from '@/hooks/api/useHabits';
import { HabitCard } from '@/components/shared/HabitCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

// ── Schema ────────────────────────────────────────────────────────────────────

const createHabitSchema = z.object({
  title:       z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId:  z.string().optional(),
  icon:        z.string().max(8).optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid colour').optional(),
});

type CreateHabitForm = z.infer<typeof createHabitSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCompleted(habit: Habit): boolean {
  return (habit as HabitWithTodayLog).todayLog?.status === 'completed';
}

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'morning',   label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening',   label: 'Evening' },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]['key'];

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.055 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.4, 0.25, 1] } },
};

// ── Create Habit Sheet ────────────────────────────────────────────────────────

interface CreateHabitSheetProps {
  open:    boolean;
  onClose: () => void;
}

function CreateHabitSheet({ open, onClose }: CreateHabitSheetProps) {
  const createHabit = useCreateHabit();
  const { data: categories = [] } = useHabitCategories();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<CreateHabitForm>({ resolver: zodResolver(createHabitSchema) });

  async function onSubmit(values: CreateHabitForm) {
    await createHabit.mutateAsync({
      title:           values.title,
      description:     values.description,
      categoryId:      values.categoryId || undefined,
      icon:            values.icon || undefined,
      color:           values.color || undefined,
      frequencyConfig: { type: 'daily' },
    });
    reset();
    onClose();
  }

  const PRESET_ICONS = ['🏃', '🧘', '📚', '💧', '🏋️', '🌅', '✍️', '🎯', '🍎', '😴'];
  const PRESET_COLORS = [
    '#6d60f0', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
  ];

  const watchedIcon  = watch('icon');
  const watchedColor = watch('color');

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4 border-b border-border shrink-0">
          <SheetTitle>New Habit</SheetTitle>
          <SheetDescription>
            Build a new routine. Start with something small and achievable.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="habit-title">
                Habit name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="habit-title"
                placeholder="e.g. Morning Run"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="habit-desc">Description</Label>
              <Textarea
                id="habit-desc"
                placeholder="Why does this habit matter to you?"
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('icon', watchedIcon === emoji ? '' : emoji)}
                    className={cn(
                      'h-9 w-9 text-lg rounded-lg border transition-all',
                      watchedIcon === emoji
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:border-primary/50 hover:bg-muted',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
                <Input
                  placeholder="✨"
                  className="w-16 text-center text-lg"
                  maxLength={2}
                  value={watchedIcon ?? ''}
                  onChange={(e) => setValue('icon', e.target.value)}
                />
              </div>
            </div>

            {/* Colour picker */}
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setValue('color', watchedColor === hex ? '' : hex)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform',
                      watchedColor === hex ? 'border-foreground scale-110' : 'border-transparent',
                    )}
                    style={{ backgroundColor: hex }}
                    aria-label={hex}
                  />
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="habit-category">Category</Label>
                <Select onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger id="habit-category">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Frequency note */}
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5 border border-border">
              Frequency:{' '}
              <span className="font-medium text-foreground">Daily</span>
              {' '}· Advanced scheduling available in Settings after creation.
            </p>
          </div>

          {/* Sticky footer */}
          <div className="p-5 border-t border-border shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={createHabit.isPending}>
                Create habit
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────

export function HabitsView() {
  const today              = new Date();
  const dateStr            = format(today, 'yyyy-MM-dd');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: todayHabits = [], isLoading, isError } = useTodayHabits(today);
  const logHabit = useLogHabit();

  const completed = todayHabits.filter(isCompleted).length;
  const total     = todayHabits.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone   = total > 0 && completed === total;

  const displayedHabits = activeFilter === 'all' ? todayHabits : [];

  function handleCheck(habit: Habit, checked: boolean) {
    logHabit.mutate({
      id:      habit.id,
      payload: { date: dateStr, status: checked ? 'completed' : 'skipped' },
    });
  }

  return (
    <div className="relative min-h-full">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto pb-24 md:pb-8"
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Habits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(today, 'EEEE, MMMM d')}
            </p>
          </div>
          <Button onClick={() => setSheetOpen(true)} className="shrink-0" size="sm">
            <Plus className="h-4 w-4" />
            New Habit
          </Button>
        </motion.div>

        {/* ── Progress ── */}
        {!isLoading && total > 0 && (
          <motion.div variants={fadeUp} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {allDone ? 'All habits complete! 🎉' : 'Today\'s progress'}
              </span>
              <span className="font-bold tabular-nums text-muted-foreground">
                {completed}/{total}
              </span>
            </div>
            <Progress
              value={pct}
              className="h-2"
              indicatorClassName={allDone ? 'bg-emerald-500' : undefined}
            />
            <p className="text-xs text-muted-foreground">
              {pct}% complete · {total - completed} remaining
            </p>
          </motion.div>
        )}

        {/* ── Filter tabs ── */}
        <motion.div variants={fadeUp} className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                activeFilter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.key === 'all' && total > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">
                  {total}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Habits list ── */}
        {isLoading && (
          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[60px] rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <EmptyState
            icon={<CheckSquare />}
            title="Couldn't load habits"
            description="Make sure the server is running, then refresh."
            className="py-12 rounded-xl border border-border bg-muted/20"
          />
        )}

        {!isLoading && !isError && activeFilter !== 'all' && (
          <EmptyState
            icon={<CheckSquare />}
            title={`No ${activeFilter} habits`}
            description="Time-based filtering is available once you set reminder times."
            className="py-12 rounded-xl border border-border bg-muted/20"
          />
        )}

        {!isLoading && !isError && activeFilter === 'all' && displayedHabits.length === 0 && (
          <EmptyState
            icon={<CheckSquare />}
            title="No habits yet"
            description="Add your first habit and start building your routine today."
            action={{ label: 'Add habit', onClick: () => setSheetOpen(true), icon: <Plus /> }}
            className="py-12 rounded-xl border border-border bg-muted/20"
          />
        )}

        {!isLoading && !isError && displayedHabits.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.div variants={stagger} className="space-y-2">
              {displayedHabits.map((habit) => (
                <motion.div key={habit.id} variants={fadeUp} layout>
                  <HabitCard
                    habit={habit}
                    completed={isCompleted(habit)}
                    onCheck={handleCheck}
                    loading={
                      logHabit.isPending &&
                      (logHabit.variables as { id: string })?.id === habit.id
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30">
        <motion.button
          onClick={() => setSheetOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          aria-label="Add habit"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Create sheet */}
      <CreateHabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
