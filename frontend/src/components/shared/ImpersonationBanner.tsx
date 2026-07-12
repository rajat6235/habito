'use client';

import { Shield, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { useQueryClient } from '@tanstack/react-query';

export function ImpersonationBanner() {
  const { impersonating, impersonatedBy, clearAuth } = useAuthStore();
  const qc = useQueryClient();

  if (!impersonating) return null;

  async function endImpersonation() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      qc.clear();
      window.location.href = '/admin/users';
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 pt-safe text-amber-950 text-sm font-semibold"
    >
      <Shield className="h-4 w-4 shrink-0" />
      <span>You are impersonating a user on behalf of admin <strong>{impersonatedBy}</strong></span>
      <button
        onClick={endImpersonation}
        className="ml-auto flex items-center gap-1 rounded-md border border-amber-700 px-2 py-0.5 text-xs hover:bg-amber-600 transition-colors"
      >
        <X className="h-3 w-3" /> End session
      </button>
    </div>
  );
}
