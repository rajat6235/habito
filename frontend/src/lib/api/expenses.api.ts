import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete, PaginatedResponse } from './client';
import type { Expense, ExpenseCategory, ExpenseSummary } from '@shared/types/api.types';

export interface ExpenseItemPayload {
  name:      string;
  quantity?: number;
  unit?:     string;
  amount:    number;
}

export interface CreateExpensePayload {
  categoryId: string;
  title?:     string;
  date:       string;
  note?:      string;
  items:      ExpenseItemPayload[];
}

export interface CreateExpenseCategoryPayload {
  name:   string;
  color?: string;
  icon?:  string;
}

export const expensesApi = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<Expense>> {
    return apiGetPaginated('/expenses', params);
  },

  get(id: string): Promise<Expense> {
    return apiGet(`/expenses/${id}`);
  },

  create(payload: CreateExpensePayload): Promise<Expense> {
    return apiPost('/expenses', payload);
  },

  update(id: string, payload: Partial<CreateExpensePayload>): Promise<Expense> {
    return apiPatch(`/expenses/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/expenses/${id}`);
  },

  getCategories(): Promise<ExpenseCategory[]> {
    return apiGet('/expenses/categories');
  },

  createCategory(payload: CreateExpenseCategoryPayload): Promise<ExpenseCategory> {
    return apiPost('/expenses/categories', payload);
  },

  updateCategory(id: string, payload: Partial<CreateExpenseCategoryPayload>): Promise<ExpenseCategory> {
    return apiPatch(`/expenses/categories/${id}`, payload);
  },

  deleteCategory(id: string): Promise<void> {
    return apiDelete(`/expenses/categories/${id}`);
  },

  getSummary(): Promise<ExpenseSummary> {
    return apiGet('/expenses/summary');
  },
};
