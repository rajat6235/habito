'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';

/**
 * Bootstraps the auth session on app mount.
 * Calls /auth/refresh (uses httpOnly cookie) → /users/me to restore the
 * in-memory access token and full UserProfile after a page reload.
 * Returns true while the bootstrap is still in-flight.
 */
export function useInitAuth(): boolean {
  const { setUser, clearAuth, setLoading, isLoading } = useAuthStore();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    authApi
      .refresh()
      .then(() => authApi.getMe())
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, clearAuth, setLoading]);

  return isLoading;
}
