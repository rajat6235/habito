'use client';

import { Bell, Search, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNotificationStore } from '@/stores/notification.store';
import { useUiStore } from '@/stores/ui.store';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const unreadCount        = useNotificationStore((s) => s.unreadCount);
  const openCommandPalette = useUiStore((s) => s.openCommandPalette);
  const { theme, setTheme } = useTheme();

  useKeyboardShortcut({
    key:       'k',
    modifiers: typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? ['meta'] : ['ctrl'],
    callback:  openCommandPalette,
  });

  function cycleTheme() {
    if (theme === 'light')       setTheme('dark');
    else if (theme === 'dark')   setTheme('system');
    else                         setTheme('light');
  }

  const ThemeIcon  = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = theme === 'light' ? 'Switch to dark' : theme === 'dark' ? 'Switch to system' : 'Switch to light';

  return (
    <header className="sticky top-0 z-20 h-14 bg-background/90 backdrop-blur-md border-b border-border flex items-center px-4 md:px-5 gap-3 shrink-0">
      {/* Search trigger — looks like a real input */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 flex-1 max-w-xs h-8 px-3 rounded-lg text-sm',
          'bg-muted text-muted-foreground hover:text-foreground',
          'border border-transparent hover:border-border/80',
          'transition-all duration-150',
        )}
        aria-label="Open search (⌘K)"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline text-sm">Search…</span>
        <kbd className="hidden sm:inline-flex ml-auto items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-background rounded border border-border/60 text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Mobile title */}
      {title && (
        <h1 className="text-sm font-semibold md:hidden truncate flex-1">{title}</h1>
      )}

      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        {/* Theme */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label={themeLabel}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{themeLabel}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2" aria-hidden>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
