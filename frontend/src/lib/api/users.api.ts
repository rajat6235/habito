import { apiGet, apiPatch, apiPost, apiDelete } from './client';
import type { UserProfile, UserSession } from '@shared/types/api.types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?:  string;
  bio?:       string;
  timezone?:  string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
}

export const usersApi = {
  getMe(): Promise<UserProfile> {
    return apiGet('/users/me');
  },

  updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    return apiPatch('/users/me', payload);
  },

  changePassword(payload: ChangePasswordPayload): Promise<void> {
    return apiPost('/users/me/change-password', payload);
  },

  getSettings(): Promise<Record<string, unknown>> {
    return apiGet('/users/me/settings');
  },

  updateSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiPatch('/users/me/settings', payload);
  },

  getSessions(): Promise<UserSession[]> {
    return apiGet('/users/me/sessions');
  },

  revokeSession(id: string): Promise<void> {
    return apiDelete(`/users/me/sessions/${id}`);
  },
};
