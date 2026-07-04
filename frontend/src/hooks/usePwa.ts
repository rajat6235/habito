'use client';

import { useEffect, useState } from 'react';

interface PwaState {
  isInstalled:     boolean;
  canInstall:      boolean;
  isOffline:       boolean;
  installPrompt:   (() => Promise<void>) | null;
  swRegistered:    boolean;
}

export function usePwa(): PwaState {
  const [state, setState] = useState<PwaState>({
    isInstalled:  false,
    canInstall:   false,
    isOffline:    false,
    installPrompt: null,
    swRegistered: false,
  });

  useEffect(() => {
    // Check initial online status
    setState((s) => ({ ...s, isOffline: !navigator.onLine }));

    // Check if already installed (standalone mode)
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true;

    setState((s) => ({ ...s, isInstalled }));

    // Listen for online/offline
    const handleOnline  = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture beforeinstallprompt
    let deferredPrompt: Event & { prompt(): Promise<void> } | null = null;

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as Event & { prompt(): Promise<void> };
      setState((s) => ({
        ...s,
        canInstall:   true,
        installPrompt: async () => {
          await deferredPrompt?.prompt();
          deferredPrompt = null;
          setState((ss) => ({ ...ss, canInstall: false, installPrompt: null }));
        },
      }));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => setState((s) => ({ ...s, swRegistered: true })))
        .catch(console.error);
    }

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  return state;
}
