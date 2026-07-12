import { describe, it, expect } from 'vitest';
import {
  getTimesPerDay,
  isCompleted,
  statusColor,
  statusBg,
} from '../components/features/habits/utils/habitUtils';
import type { Habit, HabitWithTodayLog } from '@shared/types/api.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHabit(frequencyConfig: Record<string, unknown> = { type: 'daily' }, overrides: Partial<HabitWithTodayLog> = {}): HabitWithTodayLog {
  return {
    id:               'habit-1',
    userId:           'user-1',
    title:            'Test Habit',
    description:      null,
    icon:             null,
    color:            null,
    frequencyType:    'daily',
    frequencyConfig,
    priority:         'medium',
    isArchived:       false,
    currentStreak:    0,
    longestStreak:    0,
    totalCompletions: 0,
    lastCompletedDate: null,
    startDate:        '2026-01-01',
    categoryId:       null,
    createdAt:        '2026-01-01T00:00:00.000Z',
    todayLog:         null,
    timesPerDay:      1,
    ...overrides,
  } as unknown as HabitWithTodayLog;
}

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id:              'log-1',
    habitId:         'habit-1',
    logDate:         '2026-07-11',
    status:          'completed',
    value:           null,
    note:            null,
    skipReason:      null,
    completionCount: 1,
    loggedAt:        '2026-07-11T12:00:00.000Z',
    ...overrides,
  };
}

// ── getTimesPerDay ────────────────────────────────────────────────────────────

describe('getTimesPerDay', () => {
  it('returns 1 for a standard daily habit', () => {
    expect(getTimesPerDay(makeHabit({ type: 'daily' }))).toBe(1);
  });

  it('returns 1 for a weekly habit', () => {
    expect(getTimesPerDay(makeHabit({ type: 'weekly' }))).toBe(1);
  });

  it('returns 2 for twice_daily', () => {
    expect(getTimesPerDay(makeHabit({ type: 'twice_daily' }))).toBe(2);
  });

  it('returns the configured timesPerDay for custom_daily', () => {
    expect(getTimesPerDay(makeHabit({ type: 'custom_daily', timesPerDay: 5 }))).toBe(5);
  });

  it('returns 1 for custom_daily with no timesPerDay', () => {
    expect(getTimesPerDay(makeHabit({ type: 'custom_daily' }))).toBe(1);
  });

  it('returns 1 for custom_daily when timesPerDay is not a number', () => {
    expect(getTimesPerDay(makeHabit({ type: 'custom_daily', timesPerDay: 'five' }))).toBe(1);
  });

  it('returns 1 when frequencyConfig is null', () => {
    const habit = makeHabit(null as unknown as Record<string, unknown>);
    expect(getTimesPerDay(habit)).toBe(1);
  });
});

// ── isCompleted ───────────────────────────────────────────────────────────────

describe('isCompleted', () => {
  it('returns false when there is no todayLog', () => {
    expect(isCompleted(makeHabit())).toBe(false);
  });

  it('returns true when todayLog status is completed for daily habit', () => {
    const habit = makeHabit({ type: 'daily' }, { todayLog: makeLog() } as Partial<HabitWithTodayLog>);
    expect(isCompleted(habit as unknown as Habit)).toBe(true);
  });

  it('returns false when todayLog status is skipped', () => {
    const habit = makeHabit({ type: 'daily' }, { todayLog: makeLog({ status: 'skipped' }) } as Partial<HabitWithTodayLog>);
    expect(isCompleted(habit as unknown as Habit)).toBe(false);
  });

  it('returns false when multi-habit completionCount < timesPerDay', () => {
    const habit = makeHabit(
      { type: 'custom_daily', timesPerDay: 3 },
      { todayLog: makeLog({ completionCount: 2 }) } as Partial<HabitWithTodayLog>,
    );
    expect(isCompleted(habit as unknown as Habit)).toBe(false);
  });

  it('returns true when multi-habit completionCount === timesPerDay', () => {
    const habit = makeHabit(
      { type: 'custom_daily', timesPerDay: 3 },
      { todayLog: makeLog({ completionCount: 3 }) } as Partial<HabitWithTodayLog>,
    );
    expect(isCompleted(habit as unknown as Habit)).toBe(true);
  });

  it('returns true when multi-habit completionCount exceeds timesPerDay (shouldn\'t happen but defensive)', () => {
    const habit = makeHabit(
      { type: 'custom_daily', timesPerDay: 3 },
      { todayLog: makeLog({ completionCount: 4 }) } as Partial<HabitWithTodayLog>,
    );
    expect(isCompleted(habit as unknown as Habit)).toBe(true);
  });

  it('returns true for twice_daily when completionCount === 2', () => {
    const habit = makeHabit(
      { type: 'twice_daily' },
      { todayLog: makeLog({ completionCount: 2 }) } as Partial<HabitWithTodayLog>,
    );
    expect(isCompleted(habit as unknown as Habit)).toBe(true);
  });
});

// ── statusColor ───────────────────────────────────────────────────────────────

describe('statusColor', () => {
  it('returns emerald for completed', () => {
    expect(statusColor('completed')).toContain('emerald');
  });

  it('returns amber for skipped', () => {
    expect(statusColor('skipped')).toContain('amber');
  });

  it('returns rose for failed', () => {
    expect(statusColor('failed')).toContain('rose');
  });

  it('returns rose for unknown status', () => {
    expect(statusColor('unknown')).toContain('rose');
  });
});

// ── statusBg ──────────────────────────────────────────────────────────────────

describe('statusBg', () => {
  it('returns emerald background for completed', () => {
    expect(statusBg('completed')).toBe('bg-emerald-500');
  });

  it('returns amber background for skipped', () => {
    expect(statusBg('skipped')).toBe('bg-amber-400');
  });

  it('returns rose background for failed', () => {
    expect(statusBg('failed')).toBe('bg-rose-400');
  });
});
