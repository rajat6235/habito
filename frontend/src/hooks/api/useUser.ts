'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users.api';
import type { UpdateProfilePayload, ChangePasswordPayload } from '@/lib/api/users.api';
import { useToast } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';

const USER_KEYS = {
  me:       () => ['user', 'me'] as const,
  settings: () => ['user', 'settings'] as const,
  sessions: () => ['user', 'sessions'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: USER_KEYS.me(),
    queryFn:  usersApi.getMe,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc        = useQueryClient();
  const { toast } = useToast();
  const setUser   = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateMe(payload),
    onSuccess:  (updated) => {
      qc.setQueryData(USER_KEYS.me(), updated);
      setUser(updated);
      toast({ title: 'Profile saved', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Save failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersApi.changePassword(payload),
    onSuccess:  () => {
      toast({ title: 'Password changed', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Password change failed', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: USER_KEYS.settings(),
    queryFn:  usersApi.getSettings,
    staleTime: 5 * 60_000,
  });
}

export function useUserSessions() {
  return useQuery({
    queryKey: USER_KEYS.sessions(),
    queryFn:  usersApi.getSessions,
    staleTime: 30_000,
  });
}

export function useRevokeSession() {
  const qc        = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => usersApi.revokeSession(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: USER_KEYS.sessions() });
      toast({ title: 'Session revoked', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Failed to revoke session', description: String(error), variant: 'destructive' });
    },
  });
}
