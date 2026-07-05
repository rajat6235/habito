'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Calendar, Clock, Shield, CheckSquare,
  BookOpen, Target, ListTodo, Zap, Trophy, Flame,
} from 'lucide-react';
import {
  adminApi,
  type AuditLog,
  type AdminHabit,
  type AdminJournalEntry,
  type AdminGoal,
  type AdminTask,
} from '@/lib/api/admin.api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>
  );
}

function statusVariant(status: string) {
  if (status === 'active')   return 'success'     as const;
  if (status === 'disabled') return 'warning'     as const;
  return                            'destructive' as const;
}

// ── Tab sub-components ────────────────────────────────────────────────────────

function HabitsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'habits'],
    queryFn:  () => adminApi.getUserHabits(userId),
  });

  if (isLoading) return <SkeletonRows />;
  const habits = data?.data ?? [];
  if (!habits.length) return <EmptyState label="No habits yet." />;

  return (
    <div className="divide-y divide-border">
      {habits.map((h: AdminHabit) => (
        <div key={h.id} className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl leading-none">{h.icon ?? '✅'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{h.title}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {h.frequencyType.replace('_', ' ')} · {h.totalCompletions} completions · {Number(h.successRate).toFixed(0)}% success
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {h.isArchived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
            <Badge variant="outline" className="text-xs capitalize">{h.priority}</Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">🔥 {h.currentStreak}d</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JournalTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'journals'],
    queryFn:  () => adminApi.getUserJournals(userId),
  });

  if (isLoading) return <SkeletonRows />;
  const entries = data?.data ?? [];
  if (!entries.length) return <EmptyState label="No journal entries yet." />;

  return (
    <div className="divide-y divide-border">
      {entries.map((e: AdminJournalEntry) => {
        const mood = e.entryType === 'morning' ? e.moodMorning : e.moodEvening;
        return (
          <div key={e.id} className="py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {e.entryType}
                </Badge>
                {e.isDraft && <Badge variant="warning" className="text-xs">Draft</Badge>}
                {mood != null && <span className="text-xs text-muted-foreground">Mood {mood}/10</span>}
                {e.dayRating != null && <span className="text-xs text-muted-foreground">Day {e.dayRating}/10</span>}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(e.entryDate).toLocaleDateString()}
              </time>
            </div>
            {e.contentPlain && (
              <p className="text-sm text-muted-foreground line-clamp-2">{e.contentPlain}</p>
            )}
            {e.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {e.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">#{t}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoalsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'goals'],
    queryFn:  () => adminApi.getUserGoals(userId),
  });

  if (isLoading) return <SkeletonRows />;
  const goals = data?.data ?? [];
  if (!goals.length) return <EmptyState label="No goals yet." />;

  return (
    <div className="divide-y divide-border">
      {goals.map((g: AdminGoal) => {
        const pct = Number(g.progressPct);
        return (
          <div key={g.id} className="py-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{g.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {g.category.replace('_', ' ')} · {g.goalType.replace('_', ' ')}
                  {g.targetDate ? ` · Due ${new Date(g.targetDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <Badge
                variant={g.status === 'completed' ? 'success' : g.status === 'active' ? 'secondary' : 'warning'}
                className="text-xs capitalize shrink-0"
              >
                {g.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{pct.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TasksTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'tasks'],
    queryFn:  () => adminApi.getUserTasks(userId),
  });

  if (isLoading) return <SkeletonRows />;
  const tasks = data?.data ?? [];
  if (!tasks.length) return <EmptyState label="No planner tasks yet." />;

  return (
    <div className="divide-y divide-border">
      {tasks.map((t: AdminTask) => (
        <div key={t.id} className="flex items-center gap-3 py-3">
          <span className={cn('h-2 w-2 rounded-full shrink-0', t.isCompleted ? 'bg-emerald-500' : 'bg-muted-foreground')} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm truncate', t.isCompleted && 'line-through text-muted-foreground')}>
              {t.title}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {new Date(t.planDate).toLocaleDateString()} · {t.timeBlock.replace('_', ' ')}
              {t.estimatedMin ? ` · ${t.estimatedMin}min` : ''}
            </p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">P{t.priority}</Badge>
        </div>
      ))}
    </div>
  );
}

function ActivityTab({ recentActivity }: { recentActivity: AuditLog[] | undefined }) {
  if (!recentActivity) return <SkeletonRows count={5} />;
  if (!recentActivity.length) return <EmptyState label="No activity yet." />;

  return (
    <div className="divide-y divide-border">
      {recentActivity.map(log => (
        <div key={log.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="font-medium truncate">{log.action}</p>
            {log.entityType && (
              <p className="text-xs text-muted-foreground capitalize">{log.entityType}</p>
            )}
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {new Date(log.createdAt).toLocaleString()}
          </time>
        </div>
      ))}
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UserDetail({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', userId, 'overview'],
    queryFn:  () => adminApi.getUserOverview(userId),
  });

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive text-sm">Failed to load user.</p>
        <Link href="/admin/users" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
          Back to users
        </Link>
      </div>
    );
  }

  const user  = data?.user;
  const stats = data?.stats;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/admin/users" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
        <ArrowLeft className="h-4 w-4" />
        All users
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {isLoading ? (
          <Skeleton className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
            {(user?.firstName?.[0] ?? '').toUpperCase()}
            {(user?.lastName?.[0]  ?? '').toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                <Badge variant={statusVariant(user?.status ?? '')} className="capitalize">
                  {user?.status}
                </Badge>
                {user?.roles.map(r => (
                  <Badge key={r.role.name} variant="secondary" className="capitalize text-xs">
                    {r.role.name.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">@{user?.username}</p>
            </>
          )}
        </div>
      </div>

      {/* Account info */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-4 w-full" />)}</div>
        ) : (
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Email {user?.emailVerified ? 'verified' : 'not verified'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Last login {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'never'}</span>
            </div>
          </dl>
        )}
      </Card>

      {/* Stats strip */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={<CheckSquare />} label="Habits"        value={stats?.habitCount ?? 0} />
          <StatTile icon={<BookOpen />}    label="Journal"       value={stats?.journalCount ?? 0} />
          <StatTile icon={<Target />}      label="Goals"         value={stats?.goalCount ?? 0} />
          <StatTile icon={<ListTodo />}    label="Tasks"         value={stats?.taskCount ?? 0} />
          <StatTile icon={<Zap />}         label="Total XP"      value={(stats?.totalXp ?? 0).toLocaleString()} />
          <StatTile icon={<Trophy />}      label="Level"         value={stats?.level ?? 1} />
          <StatTile icon={<Flame />}       label="Best streak"   value={`${stats?.longestStreak ?? 0}d`} />
        </div>
      )}

      {/* Data tabs */}
      <Tabs defaultValue="habits">
        <TabsList className="mb-4">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <Card className="p-5">
          <TabsContent value="habits"   className="mt-0"><HabitsTab   userId={userId} /></TabsContent>
          <TabsContent value="journal"  className="mt-0"><JournalTab  userId={userId} /></TabsContent>
          <TabsContent value="goals"    className="mt-0"><GoalsTab    userId={userId} /></TabsContent>
          <TabsContent value="tasks"    className="mt-0"><TasksTab    userId={userId} /></TabsContent>
          <TabsContent value="activity" className="mt-0">
            <ActivityTab recentActivity={isLoading ? undefined : (data?.recentActivity ?? [])} />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
