import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Forgot Password · Habito' };
export { ForgotPasswordPage as default } from '@/components/features/auth/ForgotPasswordPage';
