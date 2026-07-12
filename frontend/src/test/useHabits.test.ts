import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { Habit, HabitLog } from '@shared/types/api.types';

// ── Module mocks ──────────────────────────────────────────────────────────────

const { mockToast, mockApi } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockApi: {
    today:     vi.fn(),
    log:       vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn(),
    getLogs:   vi.fn(),
    getStats:  vi.fn(),
  },
}));

vi.mock('@/stores/ui.store', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/api/habits.api', () => ({
  habitsApi: mockApi,
}));

import {
  useTodayHabits,
  useLogHabit,
  useUpdateLog,
  useDeleteLog,
  useHabitLogsRange,
} from '../hooks/api/useHabits';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    qc,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  };
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id:               'h1',
    userId:           'u1',
    title:            'Morning Run',
    description:      null,
    icon:             null,
    color:            null,
    frequencyType:    'daily',
    frequencyConfig:  { type: 'daily' },
    priority:         'medium',
    isArchived:       false,
    currentStreak:    0,
    longestStreak:    0,
    totalCompletions: 0,
    lastCompletedDate: null,
    startDate:        '2026-01-01',
    categoryId:       null,
    createdAt:        '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Habit;
}

function makeHabitLog(overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id:              'log-1',
    habitId:         'h1',
    logDate:         '2026-07-11',
    status:          'completed',
    value:           null,
    note:            null,
    skipReason:      null,
    completionCount: 1,
    loggedAt:        '2026-07-11T12:00:00.000Z',
    ...overrides,
  } as HabitLog;
}

// ── useTodayHabits ────────────────────────────────────────────────────────────

describe('useTodayHabits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches today habits and returns data', async () => {
    const habits = [makeHabit(), makeHabit({ id: 'h2', title: 'Meditation' })];
    mockApi.today.mockResolvedValue(habits);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useTodayHabits(new Date('2026-07-11')), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(mockApi.today).toHaveBeenCalledWith('2026-07-11');
  });

  it('returns empty array default while loading', () => {
    mockApi.today.mockReturnValue(new Promise(() => {})); // never resolves
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useTodayHabits(new Date('2026-07-11')), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes isError on API failure', async () => {
    mockApi.today.mockRejectedValue(new Error('Network error'));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useTodayHabits(new Date('2026-07-11')), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useLogHabit ───────────────────────────────────────────────────────────────

describe('useLogHabit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls habitsApi.log with correct arguments', async () => {
    const log = makeHabitLog();
    mockApi.log.mockResolvedValue({ ...log, timesPerDay: 1, completionCount: 1 });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogHabit(), { wrapper });

    result.current.mutate({ id: 'h1', payload: { date: '2026-07-11', status: 'completed' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.log).toHaveBeenCalledWith('h1', { date: '2026-07-11', status: 'completed' });
  });

  it('shows generic error toast on failure', async () => {
    mockApi.log.mockRejectedValue(new Error('Server error'));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogHabit(), { wrapper });

    result.current.mutate({ id: 'h1', payload: { date: '2026-07-11', status: 'completed' } });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title:   'Could not log habit',
      variant: 'destructive',
    }));
    const call = mockToast.mock.calls[0]?.[0] as { description?: string } | undefined;
    expect(call?.description).not.toContain('daily limit');
  });

  it('shows max-completions error message for HABIT_MAX_COMPLETIONS_REACHED', async () => {
    mockApi.log.mockRejectedValue(new Error('HABIT_MAX_COMPLETIONS_REACHED'));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogHabit(), { wrapper });

    result.current.mutate({ id: 'h1', payload: { date: '2026-07-11', status: 'completed' } });
    await waitFor(() => expect(result.current.isError).toBe(true));

    const call = mockToast.mock.calls[0]?.[0] as { description?: string } | undefined;
    expect(call?.description).toContain('daily limit');
  });
});

// ── useUpdateLog ──────────────────────────────────────────────────────────────

describe('useUpdateLog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls habitsApi.updateLog and shows success toast', async () => {
    const log = makeHabitLog({ status: 'skipped' });
    mockApi.updateLog.mockResolvedValue(log);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateLog('h1'), { wrapper });

    result.current.mutate({ date: '2026-07-11', payload: { status: 'skipped' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.updateLog).toHaveBeenCalledWith('h1', '2026-07-11', { status: 'skipped' });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Log updated' }));
  });

  it('shows error toast on failure', async () => {
    mockApi.updateLog.mockRejectedValue(new Error('Failed'));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateLog('h1'), { wrapper });

    result.current.mutate({ date: '2026-07-11', payload: { status: 'skipped' } });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title:   'Update failed',
      variant: 'destructive',
    }));
  });
});

// ── useDeleteLog ──────────────────────────────────────────────────────────────

describe('useDeleteLog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls habitsApi.deleteLog and shows success toast', async () => {
    mockApi.deleteLog.mockResolvedValue(undefined);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteLog('h1'), { wrapper });

    result.current.mutate('2026-07-11');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.deleteLog).toHaveBeenCalledWith('h1', '2026-07-11');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Log deleted' }));
  });
});

// ── useHabitLogsRange ─────────────────────────────────────────────────────────

describe('useHabitLogsRange', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches logs for the given date range', async () => {
    const logs = [makeHabitLog()];
    mockApi.getLogs.mockResolvedValue({
      data: logs,
      pagination: { hasNextPage: false, nextCursor: null, total: 1, page: 1, limit: 31 },
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useHabitLogsRange('h1', '2026-07-01', '2026-07-31'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getLogs).toHaveBeenCalledWith('h1', { from: '2026-07-01', to: '2026-07-31', limit: 31 });
  });

  it('is disabled when habitId is empty', () => {
    mockApi.getLogs.mockResolvedValue({ data: [], pagination: {} });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useHabitLogsRange('', '2026-07-01', '2026-07-31'),
      { wrapper },
    );
    expect(result.current.isFetching).toBe(false);
    expect(mockApi.getLogs).not.toHaveBeenCalled();
  });
});
