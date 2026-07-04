'use client';

import { WifiOff } from 'lucide-react';
import { usePwa } from '@/hooks/usePwa';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const { isOffline } = usePwa();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[190] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-destructive-foreground text-sm font-medium"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          You're offline. Changes will sync when you reconnect.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
