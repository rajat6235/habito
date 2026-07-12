import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete, PaginatedResponse } from './client';
import type { Habit, HabitLog } from '@shared/types/api.types';
import type { CustomFieldDef, CustomFieldAggregate } from '@shared/types/customFields';

export interface HabitCategory {
  id:    string;
  name:  string;
  color: string | null;
  icon:  string | null;
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
  startDate?:       string;
  endDate?:         string;
  customFields?:    CustomFieldDef[];
}

export interface LogHabitPayload {
  date:               string;
  status:             'completed' | 'skipped' | 'failed';
  value?:             number;
  note?:              string;
  skipReason?:        string;
  customFieldValues?: Record<string, unknown>;
}

export interface UpdateLogPayload {
  status?:            'completed' | 'skipped' | 'failed';
  value?:             number | null;
  note?:              string | null;
  skipReason?:        string | null;
  customFieldValues?: Record<string, unknown> | null;
}

export interface HabitStatsResponse {
  habitId:          string;
  title:            string;
  currentStreak:    number;
  longestStreak:    number;
  totalCompletions: number;
  successRate:      number;
  last30Days:       number;
  last7Days:        number;
  heatmap:          { date: string; status: string | null; value: number | null; note: string | null; completionCount: number; customFieldValues: Record<string, unknown> }[];
  byDayOfWeek:      { day: number; count: number; rate: number }[];
  fieldAnalytics?:  CustomFieldAggregate[];
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

  log(id: string, payload: LogHabitPayload): Promise<HabitLog & { timesPerDay: number; completionCount: number }> {
    return apiPost(`/habits/${id}/log`, payload);
  },

  updateLog(id: string, date: string, payload: UpdateLogPayload): Promise<HabitLog> {
    return apiPatch(`/habits/${id}/log/${date}`, payload);
  },

  deleteLog(id: string, date: string): Promise<void> {
    return apiDelete(`/habits/${id}/log/${date}`);
  },

  getLogs(id: string, params?: Record<string, unknown>): Promise<PaginatedResponse<HabitLog>> {
    return apiGetPaginated(`/habits/${id}/logs`, params);
  },

  getStats(id: string): Promise<HabitStatsResponse> {
    return apiGet(`/habits/${id}/stats`);
  },

  getCategories(): Promise<HabitCategory[]> {
    return apiGet('/habits/categories');
  },

  createCategory(payload: { name: string; color?: string; icon?: string }): Promise<HabitCategory> {
    return apiPost('/habits/categories', payload);
  },

  deleteCategory(id: string): Promise<void> {
    return apiDelete(`/habits/categories/${id}`);
  },
};
