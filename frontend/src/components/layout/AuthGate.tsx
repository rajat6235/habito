'use client';

// Auth is initialized globally by AuthProvider (refresh → getMe on mount).
// AuthGate is kept as a pass-through so the import in app/layout.tsx still works.
export function AuthGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
