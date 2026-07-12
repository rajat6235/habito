import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ── Hoist shared mock objects (must be before vi.mock calls) ──────────────────

const {
  mockHabitRepo,
  mockTxHabitLog,
  mockTxHabit,
  mockStreakResult,
} = vi.hoisted(() => {
  const mockHabitRepo = {
    findById:  vi.fn(),
    findLog:   vi.fn(),
    updateLog: vi.fn(),
  };
  const mockTxHabitLog = {
    findUnique: vi.fn(),
    upsert:     vi.fn(),
    delete:     vi.fn(),
  };
  const mockTxHabit = {
    update: vi.fn(),
  };
  const mockStreakResult = {
    currentStreak:     5,
    longestStreak:     10,
    lastCompletedDate: new Date('2026-07-11T00:00:00.000Z'),
    totalCompletions:  42,
  };
  return { mockHabitRepo, mockTxHabitLog, mockTxHabit, mockStreakResult };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../config/database', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({ habitLog: mockTxHabitLog, habit: mockTxHabit }),
    ),
    habit:    { update: vi.fn() },
    habitLog: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock('../container', () => ({
  container: { habitRepository: mockHabitRepo },
}));

vi.mock('../services/streak.service', () => ({
  recalculateHabitStreak: vi.fn().mockResolvedValue(mockStreakResult),
}));

import { logHabit, deleteLog, updateLog } from '../api/v1/habits/habits.controller';
import { prisma } from '../config/database';
import { recalculateHabitStreak } from '../services/streak.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHabit(overrides: Record<string, unknown> = {}) {
  return {
    id:                'habit-id',
    userId:            'user-id',
    title:             'Morning Run',
    frequencyConfig:   { type: 'daily' },
    currentStreak:     4,
    longestStreak:     9,
    lastCompletedDate: null,
    totalCompletions:  41,
    ...overrides,
  };
}

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id:              'log-id',
    habitId:         'habit-id',
    userId:          'user-id',
    logDate:         new Date('2026-07-11T00:00:00.000Z'),
    status:          'completed',
    completionCount: 1,
    note:            null,
    value:           null,
    skipReason:      null,
    loggedAt:        new Date(),
    createdAt:       new Date(),
    ...overrides,
  };
}

function req(overrides: Record<string, unknown> = {}): Request {
  return {
    params: {},
    query:  {},
    body:   {},
    user:   { id: 'user-id', email: 'test@test.com', roles: ['user'] },
    ...overrides,
  } as unknown as Request;
}

function res(): Response {
  return {
    status(code: number) { void code; return this; },
    json(body: unknown)  { void body; return this; },
    send(body?: unknown) { void body; return this; },
  } as unknown as Response;
}

// ── logHabit ──────────────────────────────────────────────────────────────────

describe('logHabit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHabitRepo.findById.mockResolvedValue(makeHabit());
    mockTxHabitLog.findUnique.mockResolvedValue(null);
    mockTxHabitLog.upsert.mockResolvedValue(makeLog());
    mockTxHabit.update.mockResolvedValue({});
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: unknown) => unknown) => fn({ habitLog: mockTxHabitLog, habit: mockTxHabit }),
    );
  });

  afterEach(() => { vi.useRealTimers(); });

  it('rejects a future date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'habit-id' }, body: { date: '2026-07-12', status: 'completed' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FUTURE_DATE_NOT_ALLOWED' }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 404 when habit not found', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));
    mockHabitRepo.findById.mockResolvedValue(null);

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'missing' }, body: { date: '2026-07-11', status: 'completed' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('blocks when daily max completions are reached', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));
    mockTxHabitLog.findUnique.mockResolvedValue(makeLog({ completionCount: 1 }));

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'habit-id' }, body: { date: '2026-07-11', status: 'completed' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HABIT_MAX_COMPLETIONS_REACHED' }),
    );
  });

  it('allows a custom_daily habit with timesPerDay=3 to log a 3rd completion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));
    mockHabitRepo.findById.mockResolvedValue(
      makeHabit({ frequencyConfig: { type: 'custom_daily', timesPerDay: 3 } }),
    );
    mockTxHabitLog.findUnique.mockResolvedValue(makeLog({ completionCount: 2 }));
    mockTxHabitLog.upsert.mockResolvedValue(makeLog({ completionCount: 3 }));

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'habit-id' }, body: { date: '2026-07-11', status: 'completed' } }),
      res(), next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('blocks 4th log on a timesPerDay=3 habit', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));
    mockHabitRepo.findById.mockResolvedValue(
      makeHabit({ frequencyConfig: { type: 'custom_daily', timesPerDay: 3 } }),
    );
    mockTxHabitLog.findUnique.mockResolvedValue(makeLog({ completionCount: 3 }));

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'habit-id' }, body: { date: '2026-07-11', status: 'completed' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HABIT_MAX_COMPLETIONS_REACHED' }),
    );
  });

  it('twice_daily habit blocks a 3rd completion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00.000Z'));
    mockHabitRepo.findById.mockResolvedValue(
      makeHabit({ frequencyConfig: { type: 'twice_daily' } }),
    );
    mockTxHabitLog.findUnique.mockResolvedValue(makeLog({ completionCount: 2 }));

    const next = vi.fn() as unknown as NextFunction;
    await logHabit(
      req({ params: { id: 'habit-id' }, body: { date: '2026-07-11', status: 'completed' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HABIT_MAX_COMPLETIONS_REACHED' }),
    );
  });
});

// ── deleteLog ─────────────────────────────────────────────────────────────────

describe('deleteLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHabitRepo.findById.mockResolvedValue(makeHabit());
  });

  it('returns 404 when log does not exist', async () => {
    mockHabitRepo.findLog.mockResolvedValue(null);

    const next = vi.fn() as unknown as NextFunction;
    await deleteLog(req({ params: { id: 'habit-id', date: '2026-07-11' } }), res(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('recalculates streak after deleting a completed log', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'completed' }));
    (prisma.habitLog.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.habit.update    as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const next = vi.fn() as unknown as NextFunction;
    await deleteLog(req({ params: { id: 'habit-id', date: '2026-07-11' } }), res(), next);

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).toHaveBeenCalledWith('habit-id');
    expect(prisma.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalCompletions: 42,
          currentStreak:    5,
          longestStreak:    10,
        }),
      }),
    );
  });

  it('skips streak recalculation when deleting a skipped log', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'skipped' }));
    (prisma.habitLog.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const next = vi.fn() as unknown as NextFunction;
    await deleteLog(req({ params: { id: 'habit-id', date: '2026-07-11' } }), res(), next);

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).not.toHaveBeenCalled();
    expect(prisma.habit.update).not.toHaveBeenCalled();
  });
});

// ── updateLog ─────────────────────────────────────────────────────────────────

describe('updateLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHabitRepo.findById.mockResolvedValue(makeHabit());
    mockHabitRepo.updateLog.mockResolvedValue(makeLog());
  });

  it('returns 404 when log does not exist', async () => {
    mockHabitRepo.findLog.mockResolvedValue(null);

    const next = vi.fn() as unknown as NextFunction;
    await updateLog(
      req({ params: { id: 'habit-id', date: '2026-07-11' }, body: { note: 'test' } }),
      res(), next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('updates note without triggering streak recalculation', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'completed' }));

    const next = vi.fn() as unknown as NextFunction;
    await updateLog(
      req({ params: { id: 'habit-id', date: '2026-07-11' }, body: { note: 'Updated' } }),
      res(), next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).not.toHaveBeenCalled();
  });

  it('recalculates when status transitions completed → skipped', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'completed' }));
    mockHabitRepo.updateLog.mockResolvedValue(makeLog({ status: 'skipped' }));
    (prisma.habit.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const next = vi.fn() as unknown as NextFunction;
    await updateLog(
      req({ params: { id: 'habit-id', date: '2026-07-11' }, body: { status: 'skipped' } }),
      res(), next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).toHaveBeenCalledWith('habit-id');
    expect(prisma.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentStreak: 5, totalCompletions: 42 }),
      }),
    );
  });

  it('recalculates when status transitions skipped → completed', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'skipped' }));
    mockHabitRepo.updateLog.mockResolvedValue(makeLog({ status: 'completed' }));
    (prisma.habit.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const next = vi.fn() as unknown as NextFunction;
    await updateLog(
      req({ params: { id: 'habit-id', date: '2026-07-11' }, body: { status: 'completed' } }),
      res(), next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).toHaveBeenCalledWith('habit-id');
  });

  it('does not recalculate when status stays the same (completed → completed)', async () => {
    mockHabitRepo.findLog.mockResolvedValue(makeLog({ status: 'completed' }));
    mockHabitRepo.updateLog.mockResolvedValue(makeLog({ status: 'completed', note: 'same' }));

    const next = vi.fn() as unknown as NextFunction;
    await updateLog(
      req({ params: { id: 'habit-id', date: '2026-07-11' }, body: { status: 'completed', note: 'same' } }),
      res(), next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(recalculateHabitStreak).not.toHaveBeenCalled();
  });
});
