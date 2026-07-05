import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify Email · Habito' };
export { VerifyEmailPage as default } from '@/components/features/auth/VerifyEmailPage';
