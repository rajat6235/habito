import type { Metadata } from 'next';
import { Sidebar }   from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar }    from '@/components/layout/TopBar';
import { AuthGate }  from '@/components/layout/AuthGate';

export const metadata: Metadata = {
  title: { default: 'Dashboard · Habito', template: '%s · Habito' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto scrollbar-thin pb-safe md:pb-0">
            {/* Bottom nav safe-area offset on mobile */}
            <div className="pb-[var(--bottom-nav-height)] md:pb-0">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </AuthGate>
  );
}
