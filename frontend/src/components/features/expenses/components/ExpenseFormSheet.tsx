'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { useCreateExpense, useUpdateExpense, useExpenseCategories } from '@/hooks/api/useExpenses';
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
import { formatCurrency } from '@/lib/utils';
import { expenseFormSchema, type ExpenseForm, type ExpenseItemForm } from '../expenses.schemas';
import { ManageCategoriesDialog } from './ManageCategoriesDialog';
import type { Expense } from '@shared/types/api.types';

interface ExpenseFormSheetProps {
  open:    boolean;
  expense?: Expense | null;
  onClose: () => void;
}

function blankItem(): ExpenseItemForm {
  return { name: '', quantity: undefined, unit: '', amount: undefined as unknown as number };
}

export function ExpenseFormSheet({ open, expense, onClose }: ExpenseFormSheetProps) {
  const isEdit = Boolean(expense);
  const { data: categories = [] } = useExpenseCategories();
  const [manageOpen, setManageOpen] = useState(false);
  const createExpense = useCreateExpense();
  const updateExpense  = useUpdateExpense(expense?.id ?? '');
  const saving = isEdit ? updateExpense.isPending : createExpense.isPending;

  const {
    register, control, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          categoryId: expense.categoryId,
          title:      expense.title ?? '',
          date:       expense.date,
          note:       expense.note ?? '',
          items: expense.items.map((item) => ({
            name:     item.name,
            quantity: item.quantity ?? undefined,
            unit:     item.unit ?? '',
            amount:   item.amount,
          })),
        }
      : {
          categoryId: '',
          title:      '',
          date:       format(new Date(), 'yyyy-MM-dd'),
          note:       '',
          items:      [blankItem()],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const total = watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  function onSubmit(values: ExpenseForm) {
    const payload = {
      categoryId: values.categoryId,
      date:       values.date,
      ...(values.title ? { title: values.title } : {}),
      ...(values.note  ? { note:  values.note  } : {}),
      items: values.items.map((item) => ({
        name:   item.name,
        amount: item.amount,
        ...(item.quantity !== undefined ? { quantity: item.quantity } : {}),
        ...(item.unit ? { unit: item.unit } : {}),
      })),
    };

    const onSuccess = () => { reset(); onClose(); };
    if (isEdit) {
      updateExpense.mutate(payload, { onSuccess });
    } else {
      createExpense.mutate(payload, { onSuccess });
    }
  }

  return (
    <>
    <Sheet key={expense?.id ?? 'create'} open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg gap-0 p-0 flex flex-col"
        onInteractOutside={(e) => { if (manageOpen) e.preventDefault(); }}
        onEscapeKeyDown={(e)     => { if (manageOpen) e.preventDefault(); }}
      >
        <SheetHeader className="px-5 pt-safe-or-5 pb-4 border-b border-border shrink-0">
          <SheetTitle>{isEdit ? 'Edit expense' : 'Log an expense'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update this entry.' : 'Pick a category, then list what you spent on.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="expense-category">
                  Category <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings2 className="h-3 w-3" aria-hidden />
                  Manage
                </button>
              </div>
              <Select
                value={watch('categoryId') || undefined}
                onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
              >
                <SelectTrigger id="expense-category" aria-invalid={!!errors.categoryId}>
                  <SelectValue placeholder="Select a category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive" role="alert">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Title + date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-title">Title (optional)</Label>
                <Input id="expense-title" placeholder="e.g. Saturday night" maxLength={200} {...register('title')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Date</Label>
                <Input id="expense-date" type="date" aria-invalid={!!errors.date} {...register('date')} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Items <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</span>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Item name"
                        className="flex-1"
                        aria-label={`Item ${index + 1} name`}
                        aria-invalid={!!errors.items?.[index]?.name}
                        {...register(`items.${index}.name`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Qty"
                        type="number"
                        step="any"
                        aria-label={`Item ${index + 1} quantity`}
                        {...register(`items.${index}.quantity`)}
                      />
                      <Input
                        placeholder="Unit"
                        aria-label={`Item ${index + 1} unit`}
                        {...register(`items.${index}.unit`)}
                      />
                      <Input
                        placeholder="Amount ₹"
                        type="number"
                        step="any"
                        aria-invalid={!!errors.items?.[index]?.amount}
                        aria-label={`Item ${index + 1} amount`}
                        {...register(`items.${index}.amount`)}
                      />
                    </div>
                    {(errors.items?.[index]?.name ?? errors.items?.[index]?.amount) && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.items?.[index]?.name?.message ?? errors.items?.[index]?.amount?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {(errors.items?.root?.message ?? (typeof errors.items?.message === 'string' ? errors.items.message : undefined)) && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.items?.root?.message ?? errors.items?.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => append(blankItem())}
              >
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="expense-note">Note (optional)</Label>
              <Textarea id="expense-note" placeholder="Any context…" rows={2} {...register('note')} />
            </div>
          </div>

          <div className="p-5 border-t border-border shrink-0">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={saving}>
                {isEdit ? 'Save changes' : 'Log expense'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <ManageCategoriesDialog open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}
