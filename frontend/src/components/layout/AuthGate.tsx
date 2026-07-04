'use client';

import { useInitAuth } from '@/hooks/useInitAuth';

/**
 * Mounts in the app layout to bootstrap the auth session on every page load.
 * Shows a full-screen loading state while the refresh + getMe calls are in-flight.
 * Renders children once the auth state is known (authenticated or not).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const loading = useInitAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
