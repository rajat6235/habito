import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { getQueryClient } from '@/lib/queryClient';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

// In-memory access token — never stored in localStorage/sessionStorage
let accessToken: string | null = null;

// Queue of requests waiting for a token refresh to complete
type FailedRequest = {
  resolve: (token: string) => void;
  reject:  (error: unknown) => void;
};
let failedQueue:    FailedRequest[] = [];
let isRefreshing = false;

function drainQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else       reject(error);
  });
  failedQueue = [];
}

// Public API for auth service to set/clear the token
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Core Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,    // sends httpOnly refresh cookie
  timeout:         15_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !original._retry;

    // Don't refresh on auth-endpoint 401s (wrong password, etc.)
    const isAuthEndpoint = original.url?.includes('/auth/login') ||
                           original.url?.includes('/auth/register') ||
                           original.url?.includes('/auth/refresh');

    if (!isTokenExpired || isAuthEndpoint) {
      return Promise.reject(toApiError(error));
    }

    if (isRefreshing) {
      // Another request is already refreshing; join the queue
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      const { data } = await apiClient.post<{ data: { accessToken: string } }>(
        '/auth/refresh',
        {},
        { _retry: true } as AxiosRequestConfig,
      );
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      drainQueue(null, newToken);
      original.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      setAccessToken(null);

      // Clear all cached queries and redirect to login
      const qc = getQueryClient();
      qc.clear();

      // Set session cookie indicator to false so middleware redirects
      document.cookie = 'habito_session=; Max-Age=0; path=/';
      document.cookie = 'habito_role=; Max-Age=0; path=/';

      window.location.href = '/login?reason=session_expired';
      return Promise.reject(toApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);

// Normalise Axios errors into a consistent shape
export interface ApiError {
  code:       string;
  message:    string;
  status:     number;
  details?:   unknown[];
  requestId?: string;
}

export class ApiRequestError extends Error {
  public readonly code:      string;
  public readonly status:    number;
  public readonly details:   unknown[];
  public readonly requestId: string | undefined;

  constructor(err: ApiError) {
    super(err.message);
    this.name      = 'ApiRequestError';
    this.code      = err.code;
    this.status    = err.status;
    this.details   = err.details ?? [];
    this.requestId = err.requestId;
  }
}

function toApiError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      error?: { code?: string; message?: string; details?: unknown[] };
      requestId?: string;
    } | undefined;

    return new ApiRequestError({
      code:      data?.error?.code      ?? 'NETWORK_ERROR',
      message:   data?.error?.message   ?? error.message,
      status:    error.response?.status ?? 0,
      details:   data?.error?.details,
      requestId: data?.requestId,
    });
  }
  return new ApiRequestError({ code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', status: 0 });
}

// Typed response unwrapper
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<{ data: T }>(url, { params });
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<{ data: T }>(url, body);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.patch<{ data: T }>(url, body);
  return data.data;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const { data } = await apiClient.delete<{ data: T }>(url);
  return data.data;
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const { data } = await apiClient.post<{ data: T }>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

// Paginated response unwrapper
export interface PaginatedResponse<T> {
  data:       T[];
  pagination: {
    nextCursor:  string | null;
    prevCursor:  string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function apiGetPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
  const { data } = await apiClient.get<{ data: T[]; meta: { pagination: PaginatedResponse<T>['pagination'] } }>(
    url,
    { params },
  );
  return { data: data.data, pagination: data.meta.pagination };
}
