'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, CalendarArrowUp,
  Loader2,
} from 'lucide-react';

import {
  usePlannerTasks, useCreateTask, useUpdateTask,
  useDeleteTask, useCarryOverTasks,
} from '@/hooks/api/usePlanner';
import type { PlannerTask } from '@/lib/api/planner.api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<PlannerTask['priority'], string> = {
  low:    'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  high:   'bg-rose-500/15 text-rose-700 dark:text-rose-400',
};

const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'] as const;
type TimeBlock = (typeof TIME_BLOCKS)[number] | 'No block';

function getTimeBlock(task: PlannerTask): TimeBlock {
  if (!task.timeBlock) return 'No block';
  const b = task.timeBlock.toLowerCase();
  if (b === 'morning')   return 'Morning';
  if (b === 'afternoon') return 'Afternoon';
  if (b === 'evening')   return 'Evening';
  return 'No block';
}

// ── Task Item ─────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task:    PlannerTask;
  dateStr: string;
}

function TaskItem({ task, dateStr }: TaskItemProps) {
  const updateTask = useUpdateTask(dateStr);
  const deleteTask = useDeleteTask(dateStr);

  function toggle() {
    updateTask.mutate({ id: task.id, payload: { isCompleted: !task.isCompleted } });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
      className="group flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Checkbox
        checked={task.isCompleted}
        disabled={updateTask.isPending}
        onCheckedChange={toggle}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <motion.span
          animate={{
            opacity:         task.isCompleted ? 0.5 : 1,
            textDecoration:  task.isCompleted ? 'line-through' : 'none',
          }}
          transition={{ duration: 0.2 }}
          className="text-sm leading-snug block"
        >
          {task.title}
        </motion.span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge className={cn('text-xs px-1.5 py-0', PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </Badge>
          {task.estimatedMinutes != null && (
            <span className="text-xs text-muted-foreground">
              {task.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteTask.mutate(task.id)}
        disabled={deleteTask.isPending}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
      >
        {deleteTask.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.div>
  );
}

// ── Inline Add Task ───────────────────────────────────────────────────────────

interface AddTaskRowProps {
  dateStr:   string;
  timeBlock?: string;
}

function AddTaskRow({ dateStr, timeBlock }: AddTaskRowProps) {
  const [title,    setTitle]    = useState('');
  const [priority, setPriority] = useState<PlannerTask['priority']>('medium');
  const [active,   setActive]   = useState(false);
  const createTask = useCreateTask();
  const inputRef   = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = title.trim();
    if (!t) { setActive(false); return; }
    setTitle('');
    setActive(false);
    await createTask.mutateAsync({
      title:     t,
      date:      dateStr,
      priority,
      timeBlock: timeBlock ?? undefined,
    });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void submit(); }
    if (e.key === 'Escape') { setTitle(''); setActive(false); }
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 10); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 w-full rounded-lg hover:bg-muted/50"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => void submit()}
        placeholder="Task name…"
        className="flex-1 bg-transparent text-sm outline-none border-b border-primary placeholder:text-muted-foreground/50 py-0.5"
      />
      <Select
        value={priority}
        onValueChange={(v) => setPriority(v as PlannerTask['priority'])}
      >
        <SelectTrigger className="h-7 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Time Block Group ──────────────────────────────────────────────────────────

interface TimeBlockGroupProps {
  label:   TimeBlock;
  tasks:   PlannerTask[];
  dateStr: string;
}

function TimeBlockGroup({ label, tasks, dateStr }: TimeBlockGroupProps) {
  const timeBlockParam = label === 'No block' ? undefined : label.toLowerCase();

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2">
        {label}
      </h3>
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} dateStr={dateStr} />
        ))}
      </AnimatePresence>
      <AddTaskRow dateStr={dateStr} timeBlock={timeBlockParam} />
    </div>
  );
}

// ── Date Navigator ────────────────────────────────────────────────────────────

interface DateNavigatorProps {
  date:     Date;
  onChange: (date: Date) => void;
}

function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const today = isToday(date);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(subDays(date, 1))}
        className="rounded-lg p-1 hover:bg-muted transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex-1 text-center">
        <p className="text-sm font-semibold">
          {today ? 'Today' : format(date, 'EEEE')}
        </p>
        <p className="text-xs text-muted-foreground">{format(date, 'MMMM d, yyyy')}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        className="rounded-lg p-1 hover:bg-muted transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── PlannerView ───────────────────────────────────────────────────────────────

export function PlannerView() {
  const [date, setDate] = useState(new Date());
  const dateStr         = format(date, 'yyyy-MM-dd');
  const tomorrowStr     = format(addDays(date, 1), 'yyyy-MM-dd');

  const { data: tasks = [], isLoading } = usePlannerTasks(dateStr);
  const carryOver = useCarryOverTasks(dateStr);

  const completedCount   = tasks.filter((t) => t.isCompleted).length;
  const incompleteTasks  = tasks.filter((t) => !t.isCompleted);
  const progressPct      = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  // Group tasks by time block
  const grouped: Record<TimeBlock, PlannerTask[]> = {
    Morning:   [],
    Afternoon: [],
    Evening:   [],
    'No block': [],
  };

  for (const task of tasks) {
    const block = getTimeBlock(task);
    grouped[block].push(task);
  }

  // Sort each group by order
  const ALL_BLOCKS: TimeBlock[] = ['Morning', 'Afternoon', 'Evening', 'No block'];
  for (const block of ALL_BLOCKS) {
    grouped[block].sort((a, b) => a.order - b.order);
  }

  function goToday() {
    setDate(new Date());
  }

  function handleCarryOver() {
    carryOver.mutate({ fromDate: dateStr, toDate: tomorrowStr });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-border shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Planner
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {isToday(date) ? 'Today' : format(date, 'EEEE')}
            </h1>
          </div>
          {!isToday(date) && (
            <Button size="sm" variant="ghost" onClick={goToday} className="shrink-0 mt-1">
              Back to today
            </Button>
          )}
        </div>

        <DateNavigator date={date} onChange={setDate} />

        {/* Progress */}
        {tasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {tasks.length} tasks done</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {ALL_BLOCKS.map((block) => {
              const blockTasks = grouped[block] ?? [];
              return (
                <TimeBlockGroup
                  key={block}
                  label={block}
                  tasks={blockTasks}
                  dateStr={dateStr}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — carry over */}
      {incompleteTasks.length > 0 && (
        <div className="shrink-0 px-4 pb-4 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            leftIcon={<CalendarArrowUp className="h-4 w-4" />}
            loading={carryOver.isPending}
            onClick={handleCarryOver}
          >
            Carry over {incompleteTasks.length} incomplete task
            {incompleteTasks.length !== 1 ? 's' : ''} to tomorrow
          </Button>
        </div>
      )}
    </div>
  );
}
