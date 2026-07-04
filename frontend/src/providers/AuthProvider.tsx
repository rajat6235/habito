'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { queryKeys } from '@/lib/queryClient';
import { ApiRequestError } from '@/lib/api/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, clearAuth } = useAuthStore();

  // On mount, try to restore session via the refresh cookie
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn:  authApi.getMe,
    retry:    false,
    // Don't fetch if we know there's no session cookie
    enabled:  typeof document !== 'undefined' && document.cookie.includes('habito_session=1'),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
      return;
    }

    if (data) {
      setUser(data);
      return;
    }

    if (error) {
      const isAuthError =
        error instanceof ApiRequestError &&
        (error.status === 401 || error.code === 'TOKEN_EXPIRED');

      if (isAuthError) {
        // Try to refresh silently before giving up
        authApi.refresh().catch(() => clearAuth());
      } else {
        setLoading(false);
      }
    }
  }, [data, error, isLoading, setUser, setLoading, clearAuth]);

  return <>{children}</>;
}
