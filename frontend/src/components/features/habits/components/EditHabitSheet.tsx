'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateHabit, useHabitCategories } from '@/hooks/api/useHabits';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { createHabitSchema, type CreateHabitForm } from '../habits.schemas';
import { PRESET_ICONS, PRESET_COLORS } from '../habits.constants';
import { getTimesPerDay, getMinRequired } from '../utils/habitUtils';
import { CustomFieldsBuilder } from './CustomFieldsBuilder';
import type { CustomFieldDef } from '@shared/types/customFields';
import type { Habit } from '@shared/types/api.types';

interface EditHabitSheetProps {
  habit:   Habit | null;
  onClose: () => void;
}

function formDefaultsFor(habit: Habit | null): CreateHabitForm {
  const timesPerDay = habit ? getTimesPerDay(habit) : 1;
  const minRequired  = habit ? getMinRequired(habit) : 1;
  return {
    title:          habit?.title ?? '',
    description:    habit?.description ?? undefined,
    categoryId:     habit?.categoryId ?? undefined,
    icon:           habit?.icon ?? undefined,
    color:          habit?.color ?? undefined,
    habitType:      habit?.habitType ?? 'regular',
    timesPerDay,
    completionType: minRequired < timesPerDay ? 'minimum' : 'all',
    minRequired:    minRequired < timesPerDay ? minRequired : undefined,
  };
}

export function EditHabitSheet({ habit, onClose }: EditHabitSheetProps) {
  const updateHabit = useUpdateHabit(habit?.id ?? '');
  const { data: categories = [] } = useHabitCategories();
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(habit?.customFields ?? []);
  const addToast = useUiStore((s) => s.addToast);

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<CreateHabitForm>({
    resolver:      zodResolver(createHabitSchema),
    defaultValues: formDefaultsFor(habit),
  });

  // EditHabitSheet stays mounted across opens (same pattern as DeleteHabitConfirm/
  // HabitHistorySheet) — defaultValues only apply on the very first render, so the
  // form has to be explicitly re-seeded whenever a different habit is opened for edit.
  useEffect(() => {
    if (habit) {
      reset(formDefaultsFor(habit));
      setCustomFields(habit.customFields ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit?.id]);

  async function onSubmit(values: CreateHabitForm) {
    if (!habit) return;
    const isEvent = habit.habitType === 'event';
    const times = values.timesPerDay ?? 1;
    const min = times > 1 && values.completionType === 'minimum' && values.minRequired
      ? Math.min(values.minRequired, times)
      : undefined;
    const frequencyConfig = times > 1
      ? { type: 'custom_daily', timesPerDay: times, ...(min ? { minRequired: min } : {}) }
      : { type: 'daily' };

    try {
      const validCustomFields = customFields.filter(f => f.name.trim().length > 0);
      await updateHabit.mutateAsync({
        title:        values.title.trim(),
        description:  values.description,
        categoryId:   values.categoryId || undefined,
        icon:         values.icon || undefined,
        color:        values.color || undefined,
        ...(isEvent ? {} : { frequencyConfig }),
        customFields: validCustomFields,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update habit';
      addToast({ title: 'Could not update habit', description: msg, variant: 'destructive', duration: 4000 });
    }
  }

  const watchedIcon  = watch('icon');
  const watchedColor = watch('color');
  const watchedTimes = watch('timesPerDay') ?? 1;
  const watchedCompletionType = watch('completionType') ?? 'all';
  const watchedMinRequired    = watch('minRequired');

  if (!habit) return null;

  return (
    <Sheet key={habit.id} open={Boolean(habit)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0 flex flex-col">
        <SheetHeader className="px-5 pt-safe-or-5 pb-4 border-b border-border shrink-0">
          <SheetTitle>Edit Habit</SheetTitle>
          <SheetDescription>Update the details for &ldquo;{habit.title}&rdquo;.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-habit-title">
                Habit name <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="edit-habit-title"
                placeholder="e.g. Morning Run"
                maxLength={100}
                aria-required="true"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'edit-habit-title-error' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <p id="edit-habit-title-error" className="text-xs text-destructive" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-habit-desc">Description</Label>
              <Textarea
                id="edit-habit-desc"
                placeholder="Why does this habit matter to you?"
                rows={2}
                {...register('description')}
              />
            </div>

            {/* Times per day — regular habits only, event-based habits have no schedule */}
            {habit.habitType === 'regular' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-habit-times">Times per day</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="edit-habit-times"
                    type="number"
                    min={1}
                    max={20}
                    className="w-24"
                    aria-describedby="edit-habit-times-hint"
                    {...register('timesPerDay')}
                  />
                  <p id="edit-habit-times-hint" className="text-xs text-muted-foreground flex-1">
                    {Number(watchedTimes) > 1
                      ? `Card shows ${watchedTimes}× counter`
                      : 'Default — one completion per day'}
                  </p>
                </div>
              </div>
            )}

            {/* Completion type — only meaningful once there's more than one completion a day */}
            {habit.habitType === 'regular' && Number(watchedTimes) > 1 && (
              <div className="space-y-1.5">
                <Label>Completion type</Label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose completion type">
                  <button
                    type="button"
                    aria-pressed={watchedCompletionType === 'all'}
                    onClick={() => { setValue('completionType', 'all'); setValue('minRequired', undefined); }}
                    className={cn(
                      'text-left px-3 py-2.5 rounded-xl border transition-all',
                      watchedCompletionType === 'all'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <p className="text-sm font-medium">All required</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Every completion counts toward the day.</p>
                  </button>
                  <button
                    type="button"
                    aria-pressed={watchedCompletionType === 'minimum'}
                    onClick={() => setValue('completionType', 'minimum')}
                    className={cn(
                      'text-left px-3 py-2.5 rounded-xl border transition-all',
                      watchedCompletionType === 'minimum'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <p className="text-sm font-medium">Minimum required</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Done once you hit a minimum — rest are optional.</p>
                  </button>
                </div>

                {watchedCompletionType === 'minimum' && (
                  <div className="flex items-center gap-3 pt-1">
                    <Input
                      id="edit-habit-min-required"
                      type="number"
                      min={1}
                      max={Number(watchedTimes)}
                      className="w-24"
                      aria-describedby="edit-habit-min-required-hint"
                      {...register('minRequired')}
                    />
                    <p id="edit-habit-min-required-hint" className="text-xs text-muted-foreground flex-1">
                      Counts as done after {watchedMinRequired || 1} of {watchedTimes} — the rest log as bonus.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Icon */}
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Choose an icon">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={watchedIcon === emoji}
                    aria-label={`Icon ${emoji}`}
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
                  aria-label="Custom icon"
                  value={watchedIcon ?? ''}
                  onChange={(e) => setValue('icon', e.target.value)}
                />
              </div>
            </div>

            {/* Colour */}
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Choose a colour">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-pressed={watchedColor === hex}
                    aria-label={`Colour ${hex}`}
                    onClick={() => setValue('color', watchedColor === hex ? '' : hex)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform',
                      watchedColor === hex ? 'border-foreground scale-110' : 'border-transparent',
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-habit-category">Category</Label>
                <Select defaultValue={habit.categoryId ?? undefined} onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger id="edit-habit-category">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && !/^[a-zA-Z0-9_-]+$/.test(cat.icon) && <span aria-hidden className="mr-1.5">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Log Fields */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div>
                <Label className="text-sm font-semibold">Custom Log Fields</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional fields that appear each time you log this habit.
                </p>
              </div>
              <CustomFieldsBuilder value={customFields} onChange={setCustomFields} />
            </div>
          </div>

          <div className="p-5 border-t border-border shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={updateHabit.isPending}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
