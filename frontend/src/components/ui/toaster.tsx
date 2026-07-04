'use client';

import { useEffect } from 'react';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast';
import { useUiStore } from '@/stores/ui.store';

export function Toaster() {
  const toasts      = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant === 'success' ? 'success' : toast.variant === 'warning' ? 'warning' : toast.variant}
          duration={toast.duration}
          onRemove={removeToast}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastItem({
  id, title, description, variant, duration, onRemove,
}: {
  id:           string;
  title:        string;
  description?: string;
  variant:      'default' | 'success' | 'destructive' | 'warning';
  duration:     number;
  onRemove:     (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <Toast variant={variant} onOpenChange={(open) => { if (!open) onRemove(id); }}>
      <div className="flex-1 min-w-0">
        <ToastTitle>{title}</ToastTitle>
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      <ToastClose />
    </Toast>
  );
}
