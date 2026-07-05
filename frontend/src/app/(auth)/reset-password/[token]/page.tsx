import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reset Password · Habito' };
export { ResetPasswordPage as default } from '@/components/features/auth/ResetPasswordPage';
