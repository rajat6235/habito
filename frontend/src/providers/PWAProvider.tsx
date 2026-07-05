'use client';

import { useEffect, useRef, useState } from 'react';
import { Workbox }                      from 'workbox-window';
import { motion, AnimatePresence }      from 'framer-motion';
import { RefreshCw, X }                 from 'lucide-react';
import { Button }                       from '@/components/ui/button';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const wbRef                       = useRef<Workbox | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') return;

    const wb = new Workbox('/sw.js', { scope: '/' });
    wbRef.current = wb;

    wb.addEventListener('waiting', () => setUpdateReady(true));

    wb.register().catch(console.error);
  }, []);

  function applyUpdate() {
    const wb = wbRef.current;
    if (!wb) { window.location.reload(); return; }

    wb.addEventListener('controlling', () => window.location.reload());
    wb.messageSkipWaiting();
  }

  return (
    <>
      {children}

      <AnimatePresence>
        {updateReady && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-[calc(var(--bottom-nav-height,64px)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:left-auto z-[200] flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl"
          >
            <RefreshCw className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Update available</p>
              <p className="text-xs text-muted-foreground">A new version of Habito is ready.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={applyUpdate} className="h-8 text-xs">
                Refresh
              </Button>
              <button
                onClick={() => setUpdateReady(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
