import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface RecoveryGoal {
  id:               string;
  name:             string;
  presetType:       string | null;
  icon:             string | null;
  color:            string | null;
  personalWhy:      string | null;
  emergencyPlan:    string | null;
  startDate:        string;
  status:           'active' | 'paused' | 'completed';
  currentStreakDays: number;
  longestStreakDays: number;
  totalRelapses:    number;
  createdAt:        string;
}

export interface SobrietyClock {
  days:    number;
  hours:   number;
  minutes: number;
}

export interface RelapseLog {
  id:          string;
  relapsedAt:  string;
  moodBefore:  number | null;
  triggers:    string[];
  location:    string | null;
  notes:       string | null;
  planForNext: string | null;
  createdAt:   string;
}

export interface CreateRecoveryGoalPayload {
  name:          string;
  presetType?:   string;
  icon?:         string;
  color?:        string;
  personalWhy?:  string;
  emergencyPlan?: string;
  startDate?:    string;
}

export interface LogRelapsePayload {
  relapsedAt?:  string;
  moodBefore?:  number;
  triggers?:    string[];
  location?:    string;
  notes?:       string;
  planForNext?: string;
}

export const recoveryApi = {
  list(): Promise<RecoveryGoal[]> {
    return apiGet('/recovery');
  },

  create(payload: CreateRecoveryGoalPayload): Promise<RecoveryGoal> {
    return apiPost('/recovery', payload);
  },

  get(id: string): Promise<RecoveryGoal> {
    return apiGet(`/recovery/${id}`);
  },

  update(id: string, payload: Partial<CreateRecoveryGoalPayload>): Promise<RecoveryGoal> {
    return apiPatch(`/recovery/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/recovery/${id}`);
  },

  pause(id: string): Promise<RecoveryGoal> {
    return apiPost(`/recovery/${id}/pause`, {});
  },

  resume(id: string): Promise<RecoveryGoal> {
    return apiPost(`/recovery/${id}/resume`, {});
  },

  logRelapse(id: string, payload: LogRelapsePayload): Promise<RelapseLog> {
    return apiPost(`/recovery/${id}/relapse`, payload);
  },

  getClock(id: string): Promise<SobrietyClock> {
    return apiGet(`/recovery/${id}/clock`);
  },

  getRelapses(id: string): Promise<RelapseLog[]> {
    return apiGet(`/recovery/${id}/relapses`);
  },
};
