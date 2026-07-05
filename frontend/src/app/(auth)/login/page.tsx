import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign In · Habito' };

// The actual login form is a Client Component — split for server/client boundary
export { LoginPage as default } from '@/components/features/auth/LoginPage';
