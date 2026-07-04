import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Toast {
  id:          string;
  title:       string;
  description?: string;
  variant:     'default' | 'success' | 'destructive' | 'warning';
  duration:    number;
}

interface UiState {
  // Sidebar
  sidebarCollapsed:    boolean;
  sidebarMobileOpen:   boolean;

  // Command palette
  commandPaletteOpen:  boolean;

  // Toasts
  toasts:              Toast[];

  // Active modal
  activeModal:         string | null;
  modalData:           unknown;

  // Actions
  toggleSidebar:       () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarMobileOpen:(open: boolean) => void;

  openCommandPalette:  () => void;
  closeCommandPalette: () => void;

  addToast:            (toast: Omit<Toast, 'id'>) => void;
  removeToast:         (id: string) => void;

  openModal:           (name: string, data?: unknown) => void;
  closeModal:          () => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed:   false,
      sidebarMobileOpen:  false,
      commandPaletteOpen: false,
      toasts:             [],
      activeModal:        null,
      modalData:          null,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setSidebarMobileOpen: (sidebarMobileOpen) => set({ sidebarMobileOpen }),

      openCommandPalette:  () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: String(++toastCounter) },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      openModal: (name, data) => set({ activeModal: name, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name:    'habito-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist sidebar preferences
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);

// Helper hook for toast
export function useToast() {
  const addToast    = useUiStore((s) => s.addToast);
  const removeToast = useUiStore((s) => s.removeToast);

  return {
    toast: (options: Omit<Toast, 'id' | 'duration'> & { duration?: number }) =>
      addToast({ duration: 4000, ...options }),
    dismiss: removeToast,
  };
}
