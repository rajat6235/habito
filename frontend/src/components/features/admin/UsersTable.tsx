'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight,
  UserX, UserCheck, Loader2, Eye, Trash2,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { adminApi, type AdminUser } from '@/lib/api/admin.api';
import Link from 'next/link';
import { useToast } from '@/stores/ui.store';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All statuses' },
  { value: 'active',   label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deleted',  label: 'Deleted' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(user: AdminUser): string {
  const first = user.firstName.charAt(0).toUpperCase();
  const last  = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
  return first + last;
}

type UserStatus = AdminUser['status'];

function statusVariant(status: UserStatus) {
  if (status === 'active')   return 'success'     as const;
  if (status === 'disabled') return 'warning'     as const;
  return                            'destructive' as const;
}

function roleNames(user: AdminUser): string {
  return user.roles.map((r) => r.role.name).join(', ') || 'user';
}

function isSuperAdmin(user: AdminUser): boolean {
  return user.roles.some((r) => r.role.name === 'super_admin');
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SKELETON_WIDTHS = [40, 120, 160, 64, 80, 96, 80] as const;

function UserRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {SKELETON_WIDTHS.map((w, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  target:  AdminUser | null;
  open:    boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({ target, open, onClose, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {target?.firstName} {target?.lastName}?</DialogTitle>
          <DialogDescription>
            This will soft-delete the account. The user will no longer be able to log in.
            Their data is retained and the action is reversible by an engineer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={isPending}>
            <Trash2 className="h-4 w-4" />
            Delete user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UsersTable() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage]     = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { toast } = useToast();
  const qc        = useQueryClient();

  // ── Query ──────────────────────────────────────────────────────────────────

  const queryKey = ['admin', 'users', { search: debouncedSearch, status, page }] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status !== 'all' ? { status: status as AdminUser['status'] } : {}),
      }),
    staleTime: 30_000,
  });

  function applySearch(value: string) { setSearch(value); setPage(1); }
  function applyStatus(value: string) { setStatus(value); setPage(1); }

  // ── Mutations ──────────────────────────────────────────────────────────────

  const disableMutation = useMutation({
    mutationFn: (id: string) => adminApi.disableUser(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast({ title: 'User disabled', variant: 'default' }); },
    onError:    () => toast({ title: 'Failed to disable user', variant: 'destructive' }),
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => adminApi.enableUser(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast({ title: 'User enabled', variant: 'success' }); },
    onError:    () => toast({ title: 'Failed to enable user', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User deleted', variant: 'default' });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: 'Failed to delete user', variant: 'destructive' }),
  });

  // ── Pagination ─────────────────────────────────────────────────────────────

  const pagination = data?.meta.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pagination ? `${pagination.total.toLocaleString()} total users` : 'Loading…'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            leftIcon={<Search />}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => applySearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={applyStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isError ? (
          <p className="p-6 text-sm text-destructive">Failed to load users.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground w-10" />
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Name</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Email</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Roles</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Joined</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <UserRowSkeleton key={i} />)
                  : (data?.data ?? []).map((user) => {
                      const isMutatingToggle =
                        (disableMutation.isPending && disableMutation.variables === user.id) ||
                        (enableMutation.isPending  && enableMutation.variables  === user.id);
                      const isDeletingThis =
                        deleteMutation.isPending && deleteMutation.variables === user.id;
                      const canDelete = !isSuperAdmin(user) && user.status !== 'deleted';

                      return (
                        <tr
                          key={user.id}
                          className={cn(
                            'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                            (isMutatingToggle || isDeletingThis) && 'opacity-60 pointer-events-none',
                          )}
                        >
                          {/* Avatar */}
                          <td className="py-3 px-4">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(user)}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="py-3 px-4 font-medium whitespace-nowrap">
                            {user.firstName} {user.lastName ?? ''}
                            <div className="text-xs text-muted-foreground font-normal">@{user.username}</div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 text-muted-foreground">{user.email}</td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <Badge variant={statusVariant(user.status)} className="capitalize">
                              {user.status}
                            </Badge>
                          </td>

                          {/* Roles */}
                          <td className="py-3 px-4 text-muted-foreground capitalize">
                            {roleNames(user)}
                          </td>

                          {/* Joined */}
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View detail */}
                              <Link
                                href={`/admin/users/${user.id}`}
                                title="View user"
                                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>

                              {/* Disable / Enable toggle */}
                              {user.status === 'active' ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Disable user"
                                  onClick={() => disableMutation.mutate(user.id)}
                                  disabled={isMutatingToggle}
                                >
                                  {isMutatingToggle && disableMutation.variables === user.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <UserX className="h-3.5 w-3.5 text-amber-500" />
                                  }
                                </Button>
                              ) : user.status === 'disabled' ? (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Enable user"
                                  onClick={() => enableMutation.mutate(user.id)}
                                  disabled={isMutatingToggle}
                                >
                                  {isMutatingToggle && enableMutation.variables === user.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  }
                                </Button>
                              ) : null}

                              {/* Delete */}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Delete user"
                                  onClick={() => setDeleteTarget(user)}
                                  disabled={isDeletingThis}
                                >
                                  {isDeletingThis
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  }
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }

                {!isLoading && (data?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pagination.page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirm Dialog */}
      <DeleteDialog
        target={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
