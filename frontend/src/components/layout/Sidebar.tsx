'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Shield, BookOpen, StickyNote,
  Dumbbell, Target, Calendar, CalendarDays, BarChart2,
  Trophy, Settings, ChevronLeft, ChevronRight, LogOut, ShieldCheck,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard',    href: '/app',             icon: LayoutDashboard },
      { label: 'Habits',       href: '/app/habits',       icon: CheckSquare },
      { label: 'Journal',      href: '/app/journal',      icon: BookOpen },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { label: 'Recovery',     href: '/app/recovery',     icon: Shield },
      { label: 'Gym',          href: '/app/gym',          icon: Dumbbell },
    ],
  },
  {
    label: 'Organize',
    items: [
      { label: 'Goals',        href: '/app/goals',        icon: Target },
      { label: 'Notes',        href: '/app/notes',        icon: StickyNote },
      { label: 'Planner',      href: '/app/planner',      icon: Calendar },
      { label: 'Calendar',     href: '/app/calendar',     icon: CalendarDays },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics',    href: '/app/analytics',    icon: BarChart2 },
      { label: 'Achievements', href: '/app/achievements', icon: Trophy },
    ],
  },
];

const SETTINGS_ITEM: NavItem = { label: 'Settings', href: '/app/settings', icon: Settings };
const ADMIN_ITEM:    NavItem = { label: 'Admin',    href: '/admin',        icon: ShieldCheck };

function SidebarLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        'transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-primary',
          'transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          active ? 'text-primary' : 'text-current',
        )}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden whitespace-nowrap min-w-0"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  user,
  logout,
  toggleSidebar,
  onNavClick,
}: {
  collapsed: boolean;
  pathname: string;
  user: ReturnType<typeof useAuth>['user'];
  logout: ReturnType<typeof useAuth>['logout'];
  toggleSidebar: () => void;
  onNavClick?: () => void;
}) {
  function isActive(href: string) {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  }

  const fullName = (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || (user?.username ?? '');
  const initials = getInitials(fullName || '?');

  return (
    <>
      {/* Header — pt-safe aligns with TopBar so the logo row clears the notch */}
      <div className="border-b border-border shrink-0 pt-safe">
      <div className="flex items-center h-14 px-3 gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.span key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="text-base font-bold gradient-text mx-auto">h</motion.span>
          ) : (
            <motion.span key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="text-lg font-bold gradient-text">habito</motion.span>
          )}
        </AnimatePresence>
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={toggleSidebar} className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Collapse sidebar">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3 px-2 space-y-5" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.12 }} className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 overflow-hidden">
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => (
              <div key={item.href} onClick={onNavClick}>
                <SidebarLink item={item} collapsed={collapsed} active={isActive(item.href)} />
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom — pb-safe-or-3 ensures ≥12 px gap on all devices, more on iPhone with home bar */}
      <div className="px-2 pb-safe-or-3 space-y-0.5 border-t border-border pt-3 shrink-0">
        {user?.roles?.some(r => r === 'admin' || r === 'super_admin') && (
          <div onClick={onNavClick}><SidebarLink item={ADMIN_ITEM} collapsed={collapsed} active={isActive(ADMIN_ITEM.href)} /></div>
        )}
        <div onClick={onNavClick}><SidebarLink item={SETTINGS_ITEM} collapsed={collapsed} active={isActive(SETTINGS_ITEM.href)} /></div>

        <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2 mt-1', collapsed && 'flex-col gap-1')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-default" aria-label={fullName || 'Profile'}>
                {initials}
              </div>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{fullName || 'Profile'}</TooltipContent>}
          </Tooltip>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }} className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{user?.firstName ?? user?.username}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => logout()} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sign out</TooltipContent>
            </Tooltip>
          )}
        </div>

        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Expand sidebar">
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname         = usePathname();
  const collapsed        = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar    = useUiStore((s) => s.toggleSidebar);
  const mobileOpen       = useUiStore((s) => s.sidebarMobileOpen);
  const setMobileOpen    = useUiStore((s) => s.setSidebarMobileOpen);
  const { user, logout } = useAuth();

  const sharedProps = { pathname, user, logout, toggleSidebar };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col h-screen bg-card border-r border-border sticky top-0 overflow-hidden z-30 select-none"
      >
        <SidebarContent {...sharedProps} collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[51] w-72 flex flex-col bg-card border-r border-border overflow-hidden select-none"
            >
              <SidebarContent {...sharedProps} collapsed={false} onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

