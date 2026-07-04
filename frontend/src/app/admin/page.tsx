import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/features/admin/AdminDashboard';

export const metadata: Metadata = { title: 'Admin Dashboard · Habito' };

export default function AdminPage() {
  return <AdminDashboard />;
}
