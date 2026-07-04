import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface Milestone {
  id:           string;
  title:        string;
  isCompleted:  boolean;
  completedAt?: string;
}

export interface Goal {
  id:            string;
  title:         string;
  description?:  string;
  category:      string;
  targetValue?:  number;
  currentValue?: number;
  unit?:         string;
  targetDate?:   string;
  status:        'not_started' | 'in_progress' | 'completed' | 'abandoned';
  progressPct:   number;
  milestones?:   Milestone[];
  createdAt:     string;
}

export interface CreateGoalPayload {
  title:        string;
  description?: string;
  category:     string;
  targetValue?: number;
  unit?:        string;
  targetDate?:  string;
}

export interface GoalListParams {
  status?:   Goal['status'];
  category?: string;
  cursor?:   string;
  limit?:    number;
}

export interface GoalListResponse {
  goals:      Goal[];
  nextCursor: string | null;
}

export const goalsApi = {
  list(params?: GoalListParams): Promise<Goal[]> {
    return apiGet('/goals', params as Record<string, unknown>);
  },

  get(id: string): Promise<Goal> {
    return apiGet(`/goals/${id}`);
  },

  create(payload: CreateGoalPayload): Promise<Goal> {
    return apiPost('/goals', payload);
  },

  update(id: string, payload: Partial<CreateGoalPayload>): Promise<Goal> {
    return apiPatch(`/goals/${id}`, payload);
  },

  updateProgress(id: string, value: number): Promise<Goal> {
    return apiPatch(`/goals/${id}/progress`, { value });
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/goals/${id}`);
  },

  createMilestone(goalId: string, title: string): Promise<Milestone> {
    return apiPost(`/goals/${goalId}/milestones`, { title });
  },

  completeMilestone(goalId: string, milestoneId: string): Promise<Milestone> {
    return apiPatch(`/goals/${goalId}/milestones/${milestoneId}/complete`, {});
  },

  deleteMilestone(goalId: string, milestoneId: string): Promise<void> {
    return apiDelete(`/goals/${goalId}/milestones/${milestoneId}`);
  },
};
