'use client';

import { useEffect, useRef } from 'react';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth, setLoading, isLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // No session cookie → not logged in, render immediately
    if (!document.cookie.includes('habito_session=1')) {
      setLoading(false);
      return;
    }

    // Refresh token → then fetch user profile sequentially
    authApi
      .refresh()
      .then(() => authApi.getMe())
      .then((profile) => setUser(profile))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, [setUser, clearAuth, setLoading]);

  // Block all children until we know the auth state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
