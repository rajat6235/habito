'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

// Bootstrap must always settle — a request that never resolves (e.g. a fetch left in limbo
// by a mobile OS suspending the page mid-flight while backgrounded) must not leave the app
// stuck on the loading spinner forever. This bounds the whole bootstrap to a fixed budget,
// independent of whatever the network/browser does.
const AUTH_BOOTSTRAP_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Auth bootstrap timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err)   => { clearTimeout(timer); reject(err); },
    );
  });
}

const PROTECTED_PREFIXES = ['/app', '/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth, setLoading, isLoading } = useAuthStore();
  const initialized = useRef(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router    = useRouter();

  useEffect(() => {
    setMounted(true);

    if (initialized.current) return;
    initialized.current = true;

    // No session cookie → not logged in, render immediately
    if (!document.cookie.includes('habito_session=1')) {
      setLoading(false);
      return;
    }

    // Refresh token → then fetch user profile sequentially, bounded so a hung
    // request can never leave isLoading stuck true.
    withTimeout(authApi.refresh().then(() => authApi.getMe()), AUTH_BOOTSTRAP_TIMEOUT_MS)
      .then((profile) => setUser(profile))
      .catch(() => {
        clearAuth();
        // The lightweight "habito_session" flag cookie (client-set, 7/30-day expiry) can
        // outlive the real server-side session — middleware only checks for its presence, so
        // it will have already let this navigation through to a protected route before we
        // knew the session was actually invalid. Clear the stale flags so middleware stops
        // readmitting us, and bounce to login ourselves since middleware won't run again for
        // a client-side-only state change. Without this, the page silently renders fully
        // logged out with no data and nothing visibly wrong — the "blank screen after a
        // while" symptom.
        document.cookie = 'habito_session=; Max-Age=0; path=/';
        document.cookie = 'habito_role=; Max-Age=0; path=/';
        if (PROTECTED_PREFIXES.some((p) => pathname?.startsWith(p))) {
          router.replace('/login?reason=session_expired');
        }
      })
      .finally(() => setLoading(false));
  }, [setUser, clearAuth, setLoading, pathname, router]);

  // Show spinner only on the client (after mount) to avoid hydration mismatch.
  // Server always renders children; spinner appears after first paint.
  if (mounted && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
