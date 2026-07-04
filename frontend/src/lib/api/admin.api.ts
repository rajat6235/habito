import { apiClient, apiGet, apiPost, apiPatch } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers:          number;
  activeUsers:         number;
  totalHabits:         number;
  totalJournalEntries: number;
}

export interface AdminUserRole {
  role: { name: string };
}

export interface AdminUser {
  id:          string;
  email:       string;
  username:    string;
  firstName:   string;
  lastName:    string | null;
  avatarUrl:   string | null;
  status:      'active' | 'disabled' | 'deleted';
  createdAt:   string;
  lastLoginAt: string | null;
  roles:       AdminUserRole[];
}

export interface AuditLog {
  id:          string;
  actorId:     string;
  entityId:    string | null;
  entityType:  string;
  action:      string;
  metadata:    Record<string, unknown> | null;
  ipAddress:   string | null;
  userAgent:   string | null;
  createdAt:   string;
}

export interface PageMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface PagedResult<T> {
  data: T[];
  meta: { pagination: PageMeta };
}

export interface ListUsersParams {
  search?: string;
  status?: 'active' | 'disabled' | 'deleted';
  page?:   number;
  limit?:  number;
  sort?:   'createdAt' | 'lastLoginAt' | 'email';
  order?:  'asc' | 'desc';
}

export interface ListAuditLogsParams {
  page?:       number;
  limit?:      number;
  actorId?:    string;
  entityType?: string;
  action?:     string;
}

export type ImpersonateReasonCategory =
  | 'bug_investigation'
  | 'user_support'
  | 'data_verification'
  | 'other';

export interface ImpersonateResult {
  accessToken:     string;
  impersonationId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function adminGetPaged<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PagedResult<T>> {
  const res = await apiClient.get<{
    data: T[];
    meta: { pagination: PageMeta };
  }>(url, { params });
  return { data: res.data.data, meta: res.data.meta };
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats(): Promise<AdminStats> {
    return apiGet<AdminStats>('/admin/stats');
  },

  listUsers(params?: ListUsersParams): Promise<PagedResult<AdminUser>> {
    return adminGetPaged<AdminUser>('/admin/users', params as Record<string, unknown> | undefined);
  },

  listAuditLogs(params?: ListAuditLogsParams): Promise<PagedResult<AuditLog>> {
    return adminGetPaged<AuditLog>('/admin/audit-logs', params as Record<string, unknown> | undefined);
  },

  disableUser(id: string): Promise<AdminUser> {
    return apiPatch<AdminUser>(`/admin/users/${id}`, { status: 'disabled' });
  },

  enableUser(id: string): Promise<AdminUser> {
    return apiPatch<AdminUser>(`/admin/users/${id}`, { status: 'active' });
  },

  impersonateUser(
    id: string,
    reason: string,
    reasonCategory: ImpersonateReasonCategory,
  ): Promise<ImpersonateResult> {
    return apiPost<ImpersonateResult>(`/admin/users/${id}/impersonate`, {
      reason,
      reasonCategory,
    });
  },
};
