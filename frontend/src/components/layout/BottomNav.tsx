'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, CheckSquare, BookOpen, Dumbbell, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';

const ITEMS = [
  { label: 'Home',    href: '/app',         icon: LayoutDashboard },
  { label: 'Habits',  href: '/app/habits',  icon: CheckSquare },
  { label: 'Journal', href: '/app/journal', icon: BookOpen },
  { label: 'Gym',     href: '/app/gym',     icon: Dumbbell },
];

export function BottomNav() {
  const pathname    = usePathname();
  const openSidebar = useUiStore((s) => s.setSidebarMobileOpen);

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-safe"
      aria-label="Bottom navigation"
    >
      <div className="flex items-stretch h-16">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              aria-current={active ? 'page' : undefined}
            >
              {/* Top indicator line */}
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Icon
                  className={cn(
                    'h-[22px] w-[22px] transition-colors duration-150',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </motion.div>

              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-colors duration-150',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => openSidebar(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          aria-label="More options"
        >
          <motion.div
            whileTap={{ scale: 0.82 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <MoreHorizontal className="h-[22px] w-[22px] text-muted-foreground" />
          </motion.div>
          <span className="text-[10px] font-medium leading-none text-muted-foreground">More</span>
        </button>
      </div>
    </nav>
  );
}
