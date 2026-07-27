'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoader } from '@/components/shared/PageLoader';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router          = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading       = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // isLoading is already fully handled one level up by AuthProvider (it blocks
  // all children until bootstrap settles) — this only ever shows for the brief
  // moment between an unauthenticated user landing here and the redirect above
  // firing. Same loader as everywhere else rather than a blank frame.
  if (isLoading || !isAuthenticated) return <PageLoader />;

  return <>{children}</>;
}
