import { z } from 'zod';

const expenseItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(200),
  quantity: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().positive().optional(),
  ),
  unit:   z.string().trim().max(50).optional(),
  amount: z.coerce.number().positive('Amount is required'),
});

export const expenseFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title:      z.string().trim().max(200).optional(),
  date:       z.string().min(1, 'Date is required'),
  note:       z.string().trim().max(1000).optional(),
  items:      z.array(expenseItemFormSchema).min(1, 'Add at least one item'),
});

export type ExpenseItemForm = z.infer<typeof expenseItemFormSchema>;
export type ExpenseForm     = z.infer<typeof expenseFormSchema>;
