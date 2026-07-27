'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?:  string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * The one branded loading state used everywhere — auth bootstrap, post-login
 * transition, and every route segment's loading.tsx. Keeping it to a single
 * component is what makes every wait in the app feel like the same product.
 */
export function PageLoader({ message, fullScreen = true, className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 bg-background',
        fullScreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-full w-full py-24',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-primary text-lg" aria-hidden>✦</span>
        <span className="text-lg font-extrabold gradient-text tracking-tight">habito</span>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <span className="sr-only">{message ?? 'Loading'}</span>
    </div>
  );
}
