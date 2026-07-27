import { create } from 'zustand';

interface NavigationState {
  isNavigating: boolean;
  start: () => void;
  done:  () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isNavigating: false,
  start: () => set({ isNavigating: true }),
  done:  () => set({ isNavigating: false }),
}));
