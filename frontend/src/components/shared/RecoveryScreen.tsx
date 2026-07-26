'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { isChunkLoadError, hardReload, resetLocalDataAndSignOut, attemptAutoRecoveryOnce } from '@/lib/pwaRecovery';

interface RecoveryScreenProps {
  error: (Error & { digest?: string }) | null;
  reset?: () => void;
}

export function RecoveryScreen({ error, reset }: RecoveryScreenProps) {
  const [autoRecovering, setAutoRecovering] = useState(false);

  useEffect(() => {
    if (error) console.error('Unhandled application error:', error);

    if (error && isChunkLoadError(error) && attemptAutoRecoveryOnce()) {
      setAutoRecovering(true);
      void hardReload();
    }
  }, [error]);

  if (autoRecovering) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Updating Habito…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <div className="flex items-center gap-1.5 mb-8">
        <span className="text-primary">✦</span>
        <span className="text-2xl font-extrabold gradient-text tracking-tight">habito</span>
      </div>

      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Habito hit an unexpected error. Reloading usually fixes it.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {reset && (
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Try again
          </button>
        )}
        <button
          onClick={() => void hardReload()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Reload app
        </button>
      </div>

      <button
        onClick={resetLocalDataAndSignOut}
        className="mt-8 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Still stuck? Reset local data &amp; sign out
      </button>
    </main>
  );
}
