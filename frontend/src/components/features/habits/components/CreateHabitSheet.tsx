'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateHabit, useHabitCategories } from '@/hooks/api/useHabits';
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
import { Sparkles } from 'lucide-react';
import { createHabitSchema, type CreateHabitForm } from '../habits.schemas';
import { PRESET_ICONS, PRESET_COLORS } from '../habits.constants';
import { CustomFieldsBuilder } from './CustomFieldsBuilder';
import { TemplateGallery } from './TemplateGallery';
import type { CustomFieldDef } from '@shared/types/customFields';
import type { HabitTemplate } from '../habits.templates';

interface CreateHabitSheetProps {
  open:    boolean;
  onClose: () => void;
}

export function CreateHabitSheet({ open, onClose }: CreateHabitSheetProps) {
  const createHabit = useCreateHabit();
  const { data: categories = [] } = useHabitCategories();
  const [customFields,     setCustomFields]     = useState<CustomFieldDef[]>([]);
  const [galleryOpen,      setGalleryOpen]      = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<CreateHabitForm>({ resolver: zodResolver(createHabitSchema) });

  function applyTemplate(template: HabitTemplate, fields: CustomFieldDef[]) {
    setCustomFields(fields);
    setValue('icon',  template.icon);
    if (!watch('title')) setValue('title', template.name);
  }

  async function onSubmit(values: CreateHabitForm) {
    const timesPerDay      = values.timesPerDay ?? 1;
    const frequencyConfig  = timesPerDay > 1
      ? { type: 'custom_daily', timesPerDay }
      : { type: 'daily' };

    await createHabit.mutateAsync({
      title:           values.title,
      description:     values.description,
      categoryId:      values.categoryId || undefined,
      icon:            values.icon || undefined,
      color:           values.color || undefined,
      frequencyConfig,
      customFields:    customFields.length > 0 ? customFields : undefined,
    });
    reset();
    setCustomFields([]);
    setGalleryOpen(false);
    onClose();
  }

  const watchedIcon  = watch('icon');
  const watchedColor = watch('color');
  const watchedTimes = watch('timesPerDay') ?? 1;

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4 border-b border-border shrink-0">
          <SheetTitle>New Habit</SheetTitle>
          <SheetDescription>Build a new routine. Start small.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="habit-title">
                Habit name <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="habit-title"
                placeholder="e.g. Morning Run"
                aria-required="true"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'habit-title-error' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <p id="habit-title-error" className="text-xs text-destructive" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="habit-desc">Description</Label>
              <Textarea
                id="habit-desc"
                placeholder="Why does this habit matter to you?"
                rows={2}
                {...register('description')}
              />
            </div>

            {/* Times per day */}
            <div className="space-y-1.5">
              <Label htmlFor="habit-times">Times per day</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="habit-times"
                  type="number"
                  min={1}
                  max={20}
                  className="w-24"
                  aria-describedby="habit-times-hint"
                  {...register('timesPerDay')}
                />
                <p id="habit-times-hint" className="text-xs text-muted-foreground flex-1">
                  {Number(watchedTimes) > 1
                    ? `Card shows ${watchedTimes}× counter`
                    : 'Default — one completion per day'}
                </p>
              </div>
            </div>

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
                <Label htmlFor="habit-category">Category</Label>
                <Select onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger id="habit-category">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && <span aria-hidden className="mr-1.5">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Log Fields */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold">Custom Log Fields</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional fields that appear each time you log this habit.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs h-8"
                  onClick={() => setGalleryOpen(true)}
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Templates
                </Button>
              </div>
              <CustomFieldsBuilder value={customFields} onChange={setCustomFields} />
            </div>
          </div>

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

    <TemplateGallery
      open={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      onSelect={applyTemplate}
    />
    </>
  );
}
