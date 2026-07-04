'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginPayload, RegisterPayload } from '@/lib/api/auth.api';
import type { UserProfile } from '@shared/types/api.types';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/stores/ui.store';
import { queryKeys } from '@/lib/queryClient';

export function useAuth() {
  const { user, isAuthenticated, isLoading, clearAuth, setUser } = useAuthStore();
  const { toast }  = useToast();
  const router     = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess:  async (data) => {
      // Set auth user from login response immediately (gives fast optimistic UX)
      setUser(data.user as unknown as UserProfile);
      // Fetch full profile (includes totalXp, level, bio, timezone, etc.)
      try {
        const profile = await authApi.getMe();
        setUser(profile);
        queryClient.setQueryData(queryKeys.auth.me(), profile);
      } catch {
        // getMe failure is non-fatal; the partial AuthUser is still usable
        queryClient.setQueryData(queryKeys.auth.me(), data.user);
      }
      toast({ title: 'Welcome back!', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Login failed', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess:  () => {
      toast({
        title:       'Account created!',
        description: 'Please check your email to verify your account.',
        variant:     'success',
      });
      router.push('/login');
    },
    onError: (error) => {
      toast({ title: 'Registration failed', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess:  () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login:    loginMutation.mutate,
    register: registerMutation.mutate,
    logout:   logoutMutation.mutate,
    loginLoading:    loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    logoutLoading:   logoutMutation.isPending,
  };
}
