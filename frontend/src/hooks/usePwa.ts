'use client';

import { useEffect, useState } from 'react';

interface PwaState {
  isInstalled:   boolean;
  canInstall:    boolean;
  isOffline:     boolean;
  installPrompt: (() => Promise<void>) | null;
}

export function usePwa(): PwaState {
  const [state, setState] = useState<PwaState>({
    isInstalled:   false,
    canInstall:    false,
    isOffline:     false,
    installPrompt: null,
  });

  useEffect(() => {
    setState((s) => ({ ...s, isOffline: !navigator.onLine }));

    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setState((s) => ({ ...s, isInstalled }));

    const handleOnline  = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    let deferredPrompt: Event & { prompt(): Promise<void> } | null = null;

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as Event & { prompt(): Promise<void> };
      setState((s) => ({
        ...s,
        canInstall:    true,
        installPrompt: async () => {
          await deferredPrompt?.prompt();
          deferredPrompt = null;
          setState((ss) => ({ ...ss, canInstall: false, installPrompt: null }));
        },
      }));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online',               handleOnline);
      window.removeEventListener('offline',              handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  return state;
}
