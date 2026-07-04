import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface PlannerTask {
  id:                string;
  title:             string;
  description?:      string;
  isCompleted:       boolean;
  priority:          'low' | 'medium' | 'high';
  timeBlock?:        string;
  estimatedMinutes?: number;
  date:              string;
  order:             number;
}

export interface CreateTaskPayload {
  title:             string;
  date:              string;
  priority?:         'low' | 'medium' | 'high';
  timeBlock?:        string;
  estimatedMinutes?: number;
  description?:      string;
}

export interface UpdateTaskPayload {
  isCompleted?: boolean;
  title?:       string;
  priority?:    'low' | 'medium' | 'high';
  timeBlock?:   string;
  description?: string;
  order?:       number;
}

export const plannerApi = {
  listByDate(date: string): Promise<PlannerTask[]> {
    return apiGet('/planner/tasks', { date });
  },

  create(payload: CreateTaskPayload): Promise<PlannerTask> {
    return apiPost('/planner/tasks', payload);
  },

  update(id: string, payload: UpdateTaskPayload): Promise<PlannerTask> {
    return apiPatch(`/planner/tasks/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/planner/tasks/${id}`);
  },

  carryOver(fromDate: string, toDate: string): Promise<PlannerTask[]> {
    return apiPost('/planner/tasks/carry-over', { fromDate, toDate });
  },
};
