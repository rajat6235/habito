'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  Target, Plus, ChevronDown, ChevronUp, Check, Trash2, Calendar,
  Flag, Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useGoals, useCreateGoal, useDeleteGoal,
  useCreateMilestone, useCompleteMilestone, useDeleteMilestone,
} from '@/hooks/api/useGoals';
import type { Goal, Milestone } from '@/lib/api/goals.api';
import { EmptyState } from '@/components/shared/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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

// ── Animations ────────────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.055 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.4, 0.25, 1] } },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const GOAL_CATEGORIES = [
  { value: 'health',       label: 'Health' },
  { value: 'career',       label: 'Career' },
  { value: 'finance',      label: 'Finance' },
  { value: 'personal',     label: 'Personal' },
  { value: 'learning',     label: 'Learning' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'other',        label: 'Other' },
] as const;

type GoalCategory = (typeof GOAL_CATEGORIES)[number]['value'];

const STATUS_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'active',      label: 'Active' },
  { key: 'completed',   label: 'Completed' },
  { key: 'abandoned',   label: 'Abandoned' },
] as const;

type StatusFilter = (typeof STATUS_TABS)[number]['key'];

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  health:       'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  career:       'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  finance:      'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  personal:     'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  learning:     'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  relationship: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  other:        'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400',
};

function categoryColor(cat: string): string {
  return (CATEGORY_COLORS as Record<string, string>)[cat] ?? CATEGORY_COLORS.other;
}

// ── Create Goal Schema ────────────────────────────────────────────────────────

const createGoalSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(120),
  description: z.string().max(500).optional(),
  category:    z.string().min(1, 'Category is required'),
  targetDate:  z.string().optional(),
  targetValue: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  unit: z.string().max(20).optional(),
});

type CreateGoalForm = z.infer<typeof createGoalSchema>;

// ── Create Goal Sheet ─────────────────────────────────────────────────────────

interface CreateGoalSheetProps {
  open:    boolean;
  onClose: () => void;
}

function CreateGoalSheet({ open, onClose }: CreateGoalSheetProps) {
  const createGoal = useCreateGoal();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<CreateGoalForm>({ resolver: zodResolver(createGoalSchema) });

  const watchedCategory = watch('category');

  async function onSubmit(values: CreateGoalForm) {
    await createGoal.mutateAsync({
      title:       values.title,
      description: values.description || undefined,
      category:    values.category,
      targetValue: values.targetValue,
      unit:        values.unit || undefined,
      targetDate:  values.targetDate || undefined,
    });
    reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4 border-b border-border shrink-0">
          <SheetTitle>New Goal</SheetTitle>
          <SheetDescription>
            Set a meaningful goal and break it into milestones.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="goal-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="goal-title"
                placeholder="e.g. Run a 5K"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="goal-desc">Description</Label>
              <Textarea
                id="goal-desc"
                placeholder="Why does this goal matter to you?"
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedCategory}
                onValueChange={(v) => setValue('category', v, { shouldValidate: true })}
              >
                <SelectTrigger aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Target date */}
            <div className="space-y-1.5">
              <Label htmlFor="goal-date">Target date</Label>
              <Input
                id="goal-date"
                type="date"
                {...register('targetDate')}
              />
            </div>

            {/* Target value + unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-value">Target value</Label>
                <Input
                  id="goal-value"
                  type="number"
                  min={0}
                  placeholder="e.g. 10"
                  {...register('targetValue')}
                />
                {errors.targetValue && (
                  <p className="text-xs text-destructive">{errors.targetValue.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-unit">Unit</Label>
                <Input
                  id="goal-unit"
                  placeholder="e.g. km, hours"
                  {...register('unit')}
                />
              </div>
            </div>
          </div>

          <div className="p-5 pt-4 border-t border-border shrink-0 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createGoal.isPending}
            >
              Create Goal
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Milestone Item ────────────────────────────────────────────────────────────

interface MilestoneItemProps {
  milestone: Milestone;
  goalId:    string;
}

function MilestoneItem({ milestone, goalId }: MilestoneItemProps) {
  const complete = useCompleteMilestone(goalId);
  const remove   = useDeleteMilestone(goalId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className="flex items-center gap-2.5 py-1"
    >
      <Checkbox
        checked={milestone.isCompleted}
        disabled={milestone.isCompleted || complete.isPending}
        onCheckedChange={() => {
          if (!milestone.isCompleted) {
            complete.mutate(milestone.id);
          }
        }}
        className="shrink-0"
      />
      <span
        className={cn(
          'flex-1 text-sm',
          milestone.isCompleted && 'line-through text-muted-foreground',
        )}
      >
        {milestone.title}
      </span>
      {milestone.completedAt && (
        <span className="text-xs text-muted-foreground shrink-0">
          {format(parseISO(milestone.completedAt), 'MMM d')}
        </span>
      )}
      <button
        type="button"
        onClick={() => remove.mutate(milestone.id)}
        disabled={remove.isPending}
        className="opacity-0 group-hover/milestone:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label="Delete milestone"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newMilestone, setNewMilestone] = useState('');
  const deleteGoal      = useDeleteGoal();
  const createMilestone = useCreateMilestone(goal.id);

  const milestones   = goal.milestones ?? [];
  const doneCount    = milestones.filter((m) => m.isCompleted).length;

  async function handleAddMilestone() {
    const title = newMilestone.trim();
    if (!title) return;
    setNewMilestone('');
    await createMilestone.mutateAsync(title);
  }

  return (
    <motion.div variants={fadeUp} layout>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm truncate">{goal.title}</span>
                <Badge className={cn('text-xs px-1.5 py-0', categoryColor(goal.category))}>
                  {goal.category}
                </Badge>
                {goal.status === 'completed' && (
                  <Badge className="text-xs px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    Completed
                  </Badge>
                )}
                {goal.status === 'abandoned' && (
                  <Badge className="text-xs px-1.5 py-0 bg-zinc-500/15 text-zinc-600">
                    Abandoned
                  </Badge>
                )}
              </div>
              {goal.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {goal.targetDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(goal.targetDate), 'MMM d')}
                </span>
              )}
              {milestones.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flag className="h-3 w-3" />
                  {doneCount}/{milestones.length}
                </span>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{Math.round(goal.progressPct)}%</span>
            </div>
            <Progress value={goal.progressPct} className="h-1.5" />
          </div>
        </div>

        {/* Expanded milestones */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="milestones"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Milestones
                </p>

                {milestones.length === 0 ? (
                  <p className="text-xs text-muted-foreground mb-3">No milestones yet.</p>
                ) : (
                  <div className="space-y-0.5 group/milestone mb-3">
                    <AnimatePresence>
                      {milestones.map((m) => (
                        <MilestoneItem key={m.id} milestone={m} goalId={goal.id} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Add milestone inline */}
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Add milestone…"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddMilestone();
                      }
                    }}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => void handleAddMilestone()}
                    disabled={!newMilestone.trim() || createMilestone.isPending}
                    aria-label="Add milestone"
                  >
                    {createMilestone.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {/* Delete goal */}
                <button
                  type="button"
                  onClick={() => deleteGoal.mutate(goal.id)}
                  disabled={deleteGoal.isPending}
                  className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete goal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── GoalsView ─────────────────────────────────────────────────────────────────

export function GoalsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sheetOpen,    setSheetOpen]    = useState(false);

  const params =
    statusFilter === 'all' ? undefined
    : statusFilter === 'active' ? { status: 'in_progress' as const }
    : statusFilter === 'completed' ? { status: 'completed' as const }
    : { status: 'abandoned' as const };

  const { data: goals = [], isLoading } = useGoals(params);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Goals</h1>
          {goals.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {goals.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setSheetOpen(true)}
        >
          New Goal
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-border overflow-x-auto shrink-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={<Target />}
            title="No goals yet"
            description="Set your first goal to start tracking your progress."
            action={{
              label:   'New Goal',
              onClick: () => setSheetOpen(true),
              icon:    <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Create goal sheet */}
      <CreateGoalSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
