import { create } from 'zustand';

interface SearchState {
  query:          string;
  isOpen:         boolean;
  recentSearches: string[];

  setQuery:       (query: string) => void;
  openSearch:     () => void;
  closeSearch:    () => void;
  addRecentSearch:(query: string) => void;
  clearRecent:    () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  query:          '',
  isOpen:         false,
  recentSearches: [],

  setQuery:    (query)  => set({ query }),
  openSearch:  ()       => set({ isOpen: true }),
  closeSearch: ()       => set({ isOpen: false, query: '' }),

  addRecentSearch: (query) =>
    set((state) => ({
      recentSearches: [
        query,
        ...state.recentSearches.filter((q) => q !== query),
      ].slice(0, 8),
    })),

  clearRecent: () => set({ recentSearches: [] }),
}));
