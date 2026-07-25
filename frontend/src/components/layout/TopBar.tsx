'use client';

import { useEffect, useState } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUiStore } from '@/stores/ui.store';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const openCommandPalette = useUiStore((s) => s.openCommandPalette);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useKeyboardShortcut({
    key:       'k',
    modifiers: typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? ['meta'] : ['ctrl'],
    callback:  openCommandPalette,
  });

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  const isDark     = mounted && resolvedTheme === 'dark';
  const ThemeIcon  = isDark ? Moon : Sun;
  const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    /*
     * pt-safe pushes the inner content below the Dynamic Island / notch while
     * the header background still extends behind it (viewportFit=cover).
     * The inner div keeps a fixed h-14 so the visual bar height is predictable.
     */
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border shrink-0 pt-safe">
      <div className="h-14 flex items-center px-4 md:px-5 gap-3">
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
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label={themeLabel}
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{themeLabel}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
