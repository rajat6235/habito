import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete, PaginatedResponse } from './client';
import type { Habit, HabitLog, HabitStats } from '@shared/types/api.types';

export interface HabitCategory {
  id:    string;
  name:  string;
  color: string;
  icon:  string;
}

export interface CreateHabitPayload {
  title:           string;
  description?:    string;
  categoryId?:     string;
  color?:          string;
  icon?:           string;
  frequencyConfig: { type: string; [key: string]: unknown };
  priority?:       'low' | 'medium' | 'high';
  reminderEnabled?: boolean;
  reminderConfig?:  Record<string, unknown>;
  startDate?:      string;
  endDate?:        string;
}

export interface LogHabitPayload {
  date:        string;
  status:      'completed' | 'skipped' | 'failed';
  value?:      number;
  note?:       string;
  skipReason?: string;
}

export const habitsApi = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<Habit>> {
    return apiGetPaginated('/habits', params);
  },

  today(date: string): Promise<Habit[]> {
    return apiGet('/habits/today', { date });
  },

  get(id: string): Promise<Habit> {
    return apiGet(`/habits/${id}`);
  },

  create(payload: CreateHabitPayload): Promise<Habit> {
    return apiPost('/habits', payload);
  },

  update(id: string, payload: Partial<CreateHabitPayload>): Promise<Habit> {
    return apiPatch(`/habits/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/habits/${id}`);
  },

  archive(id: string): Promise<Habit> {
    return apiPost(`/habits/${id}/archive`, {});
  },

  log(id: string, payload: LogHabitPayload): Promise<HabitLog> {
    return apiPost(`/habits/${id}/log`, payload);
  },

  deleteLog(id: string, date: string): Promise<void> {
    return apiDelete(`/habits/${id}/log/${date}`);
  },

  getLogs(id: string, params?: Record<string, unknown>): Promise<PaginatedResponse<HabitLog>> {
    return apiGetPaginated(`/habits/${id}/logs`, params);
  },

  getStats(id: string, period?: 'week' | 'month' | 'year'): Promise<HabitStats> {
    return apiGet(`/habits/${id}/stats`, period ? { period } : undefined);
  },

  getCategories(): Promise<HabitCategory[]> {
    return apiGet('/habits/categories');
  },

  createCategory(payload: { name: string; color: string; icon: string }): Promise<HabitCategory> {
    return apiPost('/habits/categories', payload);
  },

  deleteCategory(id: string): Promise<void> {
    return apiDelete(`/habits/categories/${id}`);
  },
};
