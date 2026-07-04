import type { Metadata } from 'next';
import { UsersTable } from '@/components/features/admin/UsersTable';

export const metadata: Metadata = { title: 'Users · Habito Admin' };

export default function AdminUsersPage() {
  return <UsersTable />;
}
