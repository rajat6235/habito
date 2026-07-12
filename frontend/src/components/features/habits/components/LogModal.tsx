'use client';

import { format } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flame, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useLogHabit } from '@/hooks/api/useHabits';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logHabitSchema, type LogHabitForm } from '../habits.schemas';
import { getTimesPerDay } from '../utils/habitUtils';
import { DynamicLogFields } from './DynamicLogFields';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';
import type { CustomFieldDef } from '@shared/types/customFields';

interface LogModalProps {
  habit:   Habit | null;
  dateStr: string;
  onClose: () => void;
}

export function LogModal({ habit, dateStr, onClose }: LogModalProps) {
  const logHabit      = useLogHabit();
  const timesPerDay   = habit ? getTimesPerDay(habit) : 1;
  const countToday    = habit ? ((habit as HabitWithTodayLog).todayLog?.completionCount ?? 0) : 0;
  const remaining     = timesPerDay - countToday;
  const customFields  = (habit?.customFields ?? []) as CustomFieldDef[];
  const streak        = habit?.currentStreak ?? 0;
  const hasCustomFields = customFields.length > 0;
  const [noteOpen, setNoteOpen] = useState(!hasCustomFields);

  const methods = useForm<LogHabitForm>({ resolver: zodResolver(logHabitSchema) });
  const { register, handleSubmit, reset, formState: { errors } } = methods;

  function onSubmit(values: LogHabitForm) {
    if (!habit) return;
    const cfv = values.customFieldValues
      ? Object.fromEntries(
          Object.entries(values.customFieldValues).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        )
      : undefined;

    logHabit.mutate(
      {
        id: habit.id,
        payload: {
          date:   dateStr,
          status: 'completed',
          ...(values.note  ? { note:  values.note  } : {}),
          ...(values.value ? { value: values.value } : {}),
          ...(cfv && Object.keys(cfv).length > 0 ? { customFieldValues: cfv } : {}),
        },
      },
      { onSuccess: () => { reset(); onClose(); } },
    );
  }

  const allDoneAlready = remaining <= 0;

  return (
    <Dialog open={Boolean(habit)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            {habit?.icon && (
              <span className="text-2xl leading-none" aria-hidden>{habit.icon}</span>
            )}
            <span>{habit?.title}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span>
              {timesPerDay > 1
                ? `Completion ${countToday + 1} of ${timesPerDay}`
                : format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMMM d')}
            </span>
            {streak >= 3 && !allDoneAlready && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {streak}-day streak
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Multi-completion progress dots */}
        {timesPerDay > 1 && (
          <div className="flex gap-1.5" role="progressbar" aria-valuenow={countToday} aria-valuemax={timesPerDay}>
            {Array.from({ length: timesPerDay }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i < countToday ? 'bg-emerald-500' : 'bg-muted',
                )}
              />
            ))}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Custom fields first — they're the primary data */}
            {hasCustomFields && (
              <DynamicLogFields fields={customFields} />
            )}

            {/* Note — collapsed by default when custom fields exist */}
            <div>
              {hasCustomFields ? (
                <button
                  type="button"
                  onClick={() => setNoteOpen(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', noteOpen && 'rotate-180')} aria-hidden />
                  {noteOpen ? 'Hide note' : 'Add a note (optional)'}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground mb-1.5">Note (optional)</p>
              )}
              {noteOpen && (
                <Textarea
                  placeholder="How did it go?"
                  rows={2}
                  className="resize-none text-sm"
                  {...register('note')}
                />
              )}
              {errors.value && <p className="text-xs text-destructive mt-1">{errors.value.message}</p>}
            </div>

            {allDoneAlready ? (
              <div className="text-center py-2">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ All {timesPerDay} done for today
                </p>
              </div>
            ) : null}

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                {allDoneAlready ? 'Close' : 'Skip'}
              </Button>
              <Button
                type="submit"
                className="flex-1 font-semibold"
                loading={logHabit.isPending}
                disabled={allDoneAlready}
              >
                {allDoneAlready
                  ? 'All done ✓'
                  : timesPerDay > 1
                    ? `Log #${countToday + 1}`
                    : 'Mark complete'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
