'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, BookOpen, BarChart3, ArrowRight } from 'lucide-react';
import { adminApi, type AuditLog } from '@/lib/api/admin.api';
import { StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Query keys ────────────────────────────────────────────────────────────────

const ADMIN_STATS_KEY    = ['admin', 'stats'] as const;
const ADMIN_AUDIT_KEY    = ['admin', 'audit-logs', { page: 1, limit: 10 }] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function AuditLogRow({ log }: { log: AuditLog }) {
  const parts  = log.action.split('.');
  const entity = parts[0] ?? log.action;
  const verb   = parts.slice(1).join('.');

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 px-4 text-sm font-mono text-muted-foreground truncate max-w-[8rem]">
        {log.actorId.slice(0, 8)}…
      </td>
      <td className="py-3 px-4">
        <Badge variant="secondary" className="text-xs capitalize">{entity}</Badge>
      </td>
      <td className="py-3 px-4 text-sm text-foreground">{verb}</td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
        {new Date(log.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

function AuditLogSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const statsQuery = useQuery({
    queryKey: ADMIN_STATS_KEY,
    queryFn:  () => adminApi.getStats(),
    staleTime: 60_000,
  });

  const auditQuery = useQuery({
    queryKey: ADMIN_AUDIT_KEY,
    queryFn:  () => adminApi.listAuditLogs({ page: 1, limit: 10 }),
    staleTime: 30_000,
  });

  const stats   = statsQuery.data;
  const loading = statsQuery.isLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform health and user overview</p>
        </div>
        <Link href="/admin/users" className={cn(buttonVariants({ size: 'sm' }))}>
          Manage Users <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={loading ? '—' : (stats?.totalUsers ?? 0)}
          icon={<Users />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Active Users"
          value={loading ? '—' : (stats?.activeUsers ?? 0)}
          icon={<Activity />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Habits Created"
          value={loading ? '—' : (stats?.totalHabits ?? 0)}
          icon={<BarChart3 />}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          loading={loading}
        />
        <StatCard
          label="Journal Entries"
          value={loading ? '—' : (stats?.totalJournalEntries ?? 0)}
          icon={<BookOpen />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">User Management</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Search, filter, disable, and impersonate users
            </p>
          </div>
          <Link href="/admin/users" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Open <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <div>
        <h2 className="text-base font-semibold mb-3">Recent Activity</h2>
        <Card className="overflow-hidden">
          {auditQuery.isError ? (
            <p className="p-6 text-sm text-destructive">Failed to load audit logs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Actor</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Entity</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Action</th>
                    <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditQuery.isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <AuditLogSkeleton key={i} />)
                    : (auditQuery.data?.data ?? []).map((log) => (
                        <AuditLogRow key={log.id} log={log} />
                      ))
                  }
                  {!auditQuery.isLoading && (auditQuery.data?.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        No audit logs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
