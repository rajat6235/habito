import { apiClient, apiGet, apiPost, apiPatch, apiDelete } from './client';

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
  status:         'active' | 'disabled' | 'deleted';
  emailVerified:  boolean;
  createdAt:      string;
  lastLoginAt:    string | null;
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

export interface UserStats {
  habitCount:       number;
  activeHabitCount: number;
  journalCount:     number;
  goalCount:        number;
  taskCount:        number;
  totalXp:          number;
  level:            number;
  longestStreak:    number;
}

export interface UserOverview {
  user:           AdminUser;
  stats:          UserStats;
  recentActivity: AuditLog[];
}

export interface AdminHabit {
  id:               string;
  title:            string;
  icon:             string | null;
  color:            string | null;
  frequencyType:    string;
  priority:         string;
  isArchived:       boolean;
  currentStreak:    number;
  longestStreak:    number;
  totalCompletions: number;
  successRate:      string;
  createdAt:        string;
}

export interface AdminJournalEntry {
  id:           string;
  entryDate:    string;
  entryType:    string;
  moodMorning:  number | null;
  moodEvening:  number | null;
  dayRating:    number | null;
  contentPlain: string | null;
  tags:         string[];
  isDraft:      boolean;
  createdAt:    string;
}

export interface AdminGoal {
  id:           string;
  title:        string;
  category:     string;
  goalType:     string;
  progressType: string;
  currentValue: string;
  targetValue:  string | null;
  progressPct:  string;
  status:       string;
  priority:     string;
  targetDate:   string | null;
  completedAt:  string | null;
  createdAt:    string;
}

export interface AdminTask {
  id:           string;
  title:        string;
  planDate:     string;
  timeBlock:    string;
  priority:     number;
  isCompleted:  boolean;
  completedAt:  string | null;
  estimatedMin: number | null;
  notes:        string | null;
  createdAt:    string;
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

  getUserOverview(id: string): Promise<UserOverview> {
    return apiGet<UserOverview>(`/admin/users/${id}/overview`);
  },

  getUserHabits(id: string, page = 1): Promise<PagedResult<AdminHabit>> {
    return adminGetPaged<AdminHabit>(`/admin/users/${id}/habits`, { page, limit: 20 });
  },

  getUserJournals(id: string, page = 1): Promise<PagedResult<AdminJournalEntry>> {
    return adminGetPaged<AdminJournalEntry>(`/admin/users/${id}/journals`, { page, limit: 20 });
  },

  getUserGoals(id: string, page = 1): Promise<PagedResult<AdminGoal>> {
    return adminGetPaged<AdminGoal>(`/admin/users/${id}/goals`, { page, limit: 20 });
  },

  getUserTasks(id: string, page = 1): Promise<PagedResult<AdminTask>> {
    return adminGetPaged<AdminTask>(`/admin/users/${id}/tasks`, { page, limit: 20 });
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

  deleteUser(id: string): Promise<{ message: string }> {
    return apiDelete<{ message: string }>(`/admin/users/${id}`);
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
