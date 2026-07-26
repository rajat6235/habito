'use client';

import { useEffect } from 'react';
import { QueryProvider }          from './QueryProvider';
import { ThemeProvider }          from './ThemeProvider';
import { AuthProvider }           from './AuthProvider';
import { PWAProvider }            from './PWAProvider';
import { Toaster }                from '@/components/ui/toaster';
import { CommandPalette }         from '@/components/shared/CommandPalette';
import { OfflineBanner }          from '@/components/shared/OfflineBanner';
import { ImpersonationBanner }    from '@/components/shared/ImpersonationBanner';
import { TooltipProvider }        from '@/components/ui/tooltip';

declare global {
  interface Window {
    __habitoSignalMounted?: () => void;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Tells the inline boot watchdog (see src/lib/bootWatchdog.ts) that React is alive and
  // rendering — fires as soon as this shell mounts, not once auth/data finishes loading, so
  // it can't race a legitimately-slow-but-healthy load.
  useEffect(() => {
    window.__habitoSignalMounted?.();
  }, []);

  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider delayDuration={400}>
          <AuthProvider>
            <PWAProvider>
              <ImpersonationBanner />
              <OfflineBanner />
              {children}
              <CommandPalette />
              <Toaster />
            </PWAProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
