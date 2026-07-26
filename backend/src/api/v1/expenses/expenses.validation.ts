import { z } from 'zod';

const expenseItemSchema = z.object({
  name:     z.string().min(1, 'Item name is required').max(200).trim(),
  quantity: z.number().positive().optional(),
  unit:     z.string().max(50).trim().optional(),
  amount:   z.number().positive('Amount must be greater than 0'),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  title:      z.string().max(200).trim().optional(),
  date:       z.string().date(),
  note:       z.string().max(1000).trim().optional(),
  items:      z.array(expenseItemSchema).min(1, 'At least one item is required'),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  cursor:     z.string().optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
});

export const createExpenseCategorySchema = z.object({
  name:  z.string().min(1, 'Name is required').max(100).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid colour').optional(),
  icon:  z.string().max(100).optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export type ExpenseItemInput   = z.infer<typeof expenseItemSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery  = z.infer<typeof listExpensesQuerySchema>;
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
