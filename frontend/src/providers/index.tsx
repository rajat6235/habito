'use client';

import { QueryProvider }          from './QueryProvider';
import { ThemeProvider }          from './ThemeProvider';
import { AuthProvider }           from './AuthProvider';
import { PWAProvider }            from './PWAProvider';
import { Toaster }                from '@/components/ui/toaster';
import { CommandPalette }         from '@/components/shared/CommandPalette';
import { OfflineBanner }          from '@/components/shared/OfflineBanner';
import { ImpersonationBanner }    from '@/components/shared/ImpersonationBanner';
import { TooltipProvider }        from '@/components/ui/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
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
