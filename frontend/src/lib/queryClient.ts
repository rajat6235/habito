import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime:          60_000,       // 1 minute — data is considered fresh
    gcTime:             5 * 60_000,   // 5 minutes — cache retained after unmount
    retry:              (failureCount, error) => {
      // Don't retry on 4xx errors (auth, validation, not found)
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus:   true,
    refetchOnReconnect:     true,
    refetchOnMount:         true,
  },
  mutations: {
    retry: false,
  },
};

// Singleton for use outside React tree (e.g., in API interceptors)
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({ defaultOptions });
  }
  return queryClientInstance;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

// Query key factories — consistent, collision-free, type-safe
export const queryKeys = {
  auth: {
    me:       () => ['auth', 'me'] as const,
    sessions: () => ['auth', 'sessions'] as const,
  },
  habits: {
    all:     (filters?: Record<string, unknown>) => ['habits', filters] as const,
    today:   (date: string) => ['habits', 'today', date] as const,
    detail:  (id: string)  => ['habits', id] as const,
    logs:    (id: string, params?: Record<string, unknown>) => ['habits', id, 'logs', params] as const,
    stats:   (id: string, period?: string) => ['habits', id, 'stats', period] as const,
    categories: () => ['habit-categories'] as const,
  },
  recovery: {
    all:    () => ['recovery'] as const,
    detail: (id: string) => ['recovery', id] as const,
    history:(id: string) => ['recovery', id, 'history'] as const,
  },
  journal: {
    all:    (params?: Record<string, unknown>) => ['journal', params] as const,
    date:   (date: string) => ['journal', 'date', date] as const,
    detail: (id: string)   => ['journal', id] as const,
  },
  notes: {
    all:     (params?: Record<string, unknown>) => ['notes', params] as const,
    detail:  (id: string)   => ['notes', id] as const,
    folders: ()              => ['notes', 'folders'] as const,
    tags:    ()              => ['notes', 'tags'] as const,
  },
  gym: {
    exercises: (params?: Record<string, unknown>) => ['gym', 'exercises', params] as const,
    exercise:  (id: string) => ['gym', 'exercises', id] as const,
    templates: ()           => ['gym', 'templates'] as const,
    template:  (id: string) => ['gym', 'templates', id] as const,
    sessions:  (params?: Record<string, unknown>) => ['gym', 'sessions', params] as const,
    session:   (id: string) => ['gym', 'sessions', id] as const,
    active:    ()           => ['gym', 'sessions', 'active'] as const,
    prs:       (exerciseId?: string) => ['gym', 'prs', exerciseId] as const,
    measurements: ()        => ['gym', 'measurements'] as const,
  },
  goals: {
    all:    (params?: Record<string, unknown>) => ['goals', params] as const,
    detail: (id: string)   => ['goals', id] as const,
  },
  planner: {
    day:  (date: string)   => ['planner', date] as const,
  },
  calendar: {
    month: (year: number, month: number, layers?: string) => ['calendar', year, month, layers] as const,
    day:   (date: string) => ['calendar', 'day', date] as const,
  },
  analytics: {
    overview: (params?: Record<string, unknown>) => ['analytics', 'overview', params] as const,
    habits:   (params?: Record<string, unknown>) => ['analytics', 'habits', params] as const,
    fitness:  (params?: Record<string, unknown>) => ['analytics', 'fitness', params] as const,
    mood:     (params?: Record<string, unknown>) => ['analytics', 'mood', params] as const,
    goals:    (params?: Record<string, unknown>) => ['analytics', 'goals', params] as const,
    recovery: (params?: Record<string, unknown>) => ['analytics', 'recovery', params] as const,
  },
  lifeBalance: {
    current: () => ['life-balance', 'current'] as const,
    history: (weeks?: number) => ['life-balance', 'history', weeks] as const,
  },
  notifications: {
    all:   (params?: Record<string, unknown>) => ['notifications', params] as const,
    count: ()                                  => ['notifications', 'count'] as const,
  },
  achievements: {
    badges:   ()            => ['achievements', 'badges'] as const,
    myBadges: ()            => ['achievements', 'my-badges'] as const,
    level:    ()            => ['achievements', 'level'] as const,
  },
  dashboard: () => ['dashboard'] as const,
  search:    (q: string, types?: string) => ['search', q, types] as const,
};
