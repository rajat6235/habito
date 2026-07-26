import { Router } from 'express';
import { ZodSchema } from 'zod';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  ListExpensesQuery,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} from './expenses.validation';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenseSummary,
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
} from './expenses.controller';

const listQuerySchema = listExpensesQuerySchema as unknown as ZodSchema<ListExpensesQuery>;

export const expensesRouter = Router();

// ── Static routes FIRST ──────────────────────────────────────────────────────
expensesRouter.get('/categories',        authenticate, listCategories);
expensesRouter.post('/categories',       authenticate, validate(createExpenseCategorySchema), createCategory);
expensesRouter.patch('/categories/:id',  authenticate, validate(updateExpenseCategorySchema), updateCategory);
expensesRouter.delete('/categories/:id', authenticate,                                        deleteCategory);
expensesRouter.get('/summary',           authenticate, getExpenseSummary);

// ── Collection ────────────────────────────────────────────────────────────────
expensesRouter.get('/',  authenticate, validate(listQuerySchema, 'query'), listExpenses);
expensesRouter.post('/', authenticate, validate(createExpenseSchema),      createExpense);

// ── Resource ──────────────────────────────────────────────────────────────────
expensesRouter.get('/:id',    authenticate,                                getExpense);
expensesRouter.patch('/:id',  authenticate, validate(updateExpenseSchema), updateExpense);
expensesRouter.delete('/:id', authenticate,                                deleteExpense);
