import type { Metadata } from 'next';
export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Habito Admin' } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center px-6">
        <span className="font-bold text-sm">Habito Admin</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
