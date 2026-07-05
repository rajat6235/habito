import type { Metadata } from 'next';
import { UserDetail } from '@/components/features/admin/UserDetail';

export const metadata: Metadata = { title: 'User Detail · Habito Admin' };

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  return <UserDetail userId={params.id} />;
}
