'use client';

import { format, parseISO } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateLog } from '@/hooks/api/useHabits';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { editLogSchema, type EditLogForm } from '../habits.schemas';
import { DynamicLogFields } from './DynamicLogFields';
import type { HabitLog } from '@shared/types/api.types';
import type { CustomFieldDef } from '@shared/types/customFields';

interface EditLogModalProps {
  log:          HabitLog | null;
  habitId:      string;
  customFields?: CustomFieldDef[];
  onClose:      () => void;
}

export function EditLogModal({ log, habitId, customFields = [], onClose }: EditLogModalProps) {
  const updateLog = useUpdateLog(habitId);

  const methods = useForm<EditLogForm>({
    resolver: zodResolver(editLogSchema),
    defaultValues: {
      status:            log?.status,
      note:              log?.note  ?? '',
      value:             log?.value ?? undefined,
      customFieldValues: (log?.customFieldValues ?? {}) as Record<string, unknown>,
    },
  });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = methods;

  const watchedStatus = watch('status');

  function onSubmit(values: EditLogForm) {
    if (!log) return;
    const cfv = values.customFieldValues
      ? Object.fromEntries(
          Object.entries(values.customFieldValues).filter(
            ([, v]) => v !== undefined && v !== '',
          ),
        )
      : undefined;

    updateLog.mutate(
      {
        date: log.logDate,
        payload: {
          ...(values.status !== undefined ? { status: values.status } : {}),
          note:  values.note  || null,
          value: values.value || null,
          ...(cfv !== undefined ? { customFieldValues: cfv } : {}),
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog key={log?.id ?? 'edit'} open={Boolean(log)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Log — {log && format(parseISO(log.logDate), 'MMM d, yyyy')}</DialogTitle>
          <DialogDescription>Update the status, notes, or value for this entry.</DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watchedStatus ?? log?.status}
                onValueChange={(v) => setValue('status', v as EditLogForm['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} placeholder="Add a note..." {...register('note')} />
            </div>

            <div className="space-y-1.5">
              <Label>Value / Quantity</Label>
              <Input type="number" step="any" {...register('value')} />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>

            {customFields.length > 0 && <DynamicLogFields fields={customFields} />}

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={updateLog.isPending}>Save</Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
