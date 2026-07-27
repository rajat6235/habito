import { apiClient, apiGet, apiPost, setAccessToken, syncSessionCookies, currentRoleCookie } from './client';
import type {
  LoginResponse,
  TokenRefreshResponse,
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
  emailOrUsername: string;
  password:        string;
  rememberMe:      boolean;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<{ userId: string }> {
    return apiPost('/auth/register', payload);
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const result = await apiPost<LoginResponse>('/auth/login', payload);
    setAccessToken(result.accessToken);
    syncSessionCookies(result.refreshTokenExpiresAt, result.user.roles[0] ?? '');
    return result;
  },

  async refresh(): Promise<TokenRefreshResponse> {
    const result = await apiPost<TokenRefreshResponse>('/auth/refresh');
    setAccessToken(result.accessToken);
    syncSessionCookies(result.refreshTokenExpiresAt, currentRoleCookie());
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
