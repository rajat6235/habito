import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/components/features/auth/LoginPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign In · Habito' };

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
