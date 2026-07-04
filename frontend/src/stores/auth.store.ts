import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@shared/types/api.types';

interface AuthState {
  user:              UserProfile | null;
  isAuthenticated:   boolean;
  isLoading:         boolean;
  impersonating:     boolean;
  impersonatedBy:    string | null;

  setUser:           (user: UserProfile | null) => void;
  setLoading:        (loading: boolean) => void;
  setImpersonation:  (adminId: string | null) => void;
  clearAuth:         () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:              null,
      isAuthenticated:   false,
      isLoading:         true,
      impersonating:     false,
      impersonatedBy:    null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setImpersonation: (adminId) =>
        set({
          impersonating:  adminId !== null,
          impersonatedBy: adminId,
        }),

      clearAuth: () =>
        set({
          user:            null,
          isAuthenticated: false,
          isLoading:       false,
          impersonating:   false,
          impersonatedBy:  null,
        }),
    }),
    {
      name:    'habito-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the user object — not loading/impersonation state
      partialize: (state) => ({
        user:           state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
