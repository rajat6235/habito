'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoader } from '@/components/shared/PageLoader';

// Allow up to 30 s for the backend to cold-start (Render free tier can take ~20 s).
// A 10 s budget was too tight and would log users out during normal cold-start wakeups.
const AUTH_BOOTSTRAP_TIMEOUT_MS = 30_000;
// Show a "server is waking up" hint after this many ms of waiting.
const SLOW_LOADING_HINT_MS      =  5_000;

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
  const [slowLoading, setSlowLoading] = useState(false);
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

  // After SLOW_LOADING_HINT_MS of waiting, reveal a friendly "waking up" message
  // so users don't think the app is frozen during a Render cold-start.
  useEffect(() => {
    if (!isLoading) { setSlowLoading(false); return; }
    const t = setTimeout(() => setSlowLoading(true), SLOW_LOADING_HINT_MS);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Show spinner only on the client (after mount) to avoid hydration mismatch.
  // Server always renders children; spinner appears after first paint.
  if (mounted && isLoading) {
    return (
      <PageLoader
        message={slowLoading ? 'Server is waking up, please wait…' : undefined}
      />
    );
  }

  return <>{children}</>;
}
