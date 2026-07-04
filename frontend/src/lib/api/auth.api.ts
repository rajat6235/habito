import { apiClient, apiGet, apiPost, setAccessToken } from './client';
import type {
  LoginResponse,
  UserProfile,
  UserSession,
} from '@shared/types/api.types';

export interface RegisterPayload {
  username:    string;
  email:       string;
  password:    string;
  firstName?:  string;
  lastName?:   string;
}

export interface LoginPayload {
  email:      string;
  password:   string;
  rememberMe: boolean;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<{ userId: string }> {
    return apiPost('/auth/register', payload);
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const result = await apiPost<LoginResponse>('/auth/login', payload);
    setAccessToken(result.accessToken);
    // Set lightweight session indicator cookie for middleware
    const maxAge = payload.rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600;
    document.cookie = `habito_session=1; Max-Age=${maxAge}; path=/; SameSite=Strict`;
    document.cookie = `habito_role=${result.user.roles[0] ?? ''}; Max-Age=${maxAge}; path=/; SameSite=Strict`;
    return result;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const result = await apiPost<{ accessToken: string }>('/auth/refresh');
    setAccessToken(result.accessToken);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } finally {
      setAccessToken(null);
      document.cookie = 'habito_session=; Max-Age=0; path=/';
      document.cookie = 'habito_role=; Max-Age=0; path=/';
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiPost('/auth/logout-all');
    } finally {
      setAccessToken(null);
      document.cookie = 'habito_session=; Max-Age=0; path=/';
      document.cookie = 'habito_role=; Max-Age=0; path=/';
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiPost('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiPost('/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get(`/auth/verify-email/${token}`);
  },

  getMe: (): Promise<UserProfile> => apiGet('/users/me'),

  async getSettings(): Promise<Record<string, unknown>> {
    return apiGet('/users/me/settings');
  },

  async getSessions(): Promise<UserSession[]> {
    return apiGet('/users/me/sessions');
  },
};
