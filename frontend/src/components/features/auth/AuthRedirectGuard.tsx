'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function AuthRedirectGuard() {
  const user   = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/app');
  }, [user, router]);

  return null;
}
