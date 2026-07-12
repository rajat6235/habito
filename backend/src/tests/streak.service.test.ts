import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { computeStreakFromDates } from '../services/streak.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a UTC Date from a YYYY-MM-DD string, midnight UTC */
function d(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Pin "today" to a fixed UTC date for deterministic streak calculations.
 * Pass the date string that should be treated as "today" by the service.
 */
function pinToday(todayStr: string) {
  const fixedNow = new Date(`${todayStr}T12:00:00.000Z`);
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
}

// ── computeStreakFromDates ────────────────────────────────────────────────────

describe('computeStreakFromDates', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns all zeros for an empty array', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([]);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, lastCompletedDate: null });
  });

  it('returns streak=1 when the only log is today', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([d('2026-07-11')]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastCompletedDate).toEqual(d('2026-07-11'));
  });

  it('returns streak=1 when the only log is yesterday', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([d('2026-07-10')]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('returns currentStreak=0 when last log was 2+ days ago', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([d('2026-07-09')]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.lastCompletedDate).toEqual(d('2026-07-09'));
  });

  it('returns streak=3 for three consecutive days ending today', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([
      d('2026-07-09'), d('2026-07-10'), d('2026-07-11'),
    ]);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('returns currentStreak=2 when gap breaks an older streak', () => {
    pinToday('2026-07-11');
    // Days: 5, 6 (streak=2), gap, 10, 11 (streak=2)
    const result = computeStreakFromDates([
      d('2026-07-05'), d('2026-07-06'),
      d('2026-07-10'), d('2026-07-11'),
    ]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('longestStreak reflects the best historical run even after a gap', () => {
    pinToday('2026-07-11');
    // Days 1-5 (streak=5), then gap, then 10-11 (streak=2)
    const result = computeStreakFromDates([
      d('2026-07-01'), d('2026-07-02'), d('2026-07-03'), d('2026-07-04'), d('2026-07-05'),
      d('2026-07-10'), d('2026-07-11'),
    ]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it('handles a single long unbroken streak', () => {
    pinToday('2026-07-11');
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date('2026-06-12T00:00:00.000Z');
      date.setUTCDate(date.getUTCDate() + i);
      return date;
    });
    const result = computeStreakFromDates(dates);
    expect(result.currentStreak).toBe(30);
    expect(result.longestStreak).toBe(30);
  });

  it('deduplicates logs on the same calendar day', () => {
    pinToday('2026-07-11');
    // Two entries for the same day (shouldn't happen in DB but service is defensive)
    const result = computeStreakFromDates([
      d('2026-07-10'), d('2026-07-10'), d('2026-07-11'),
    ]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('handles unsorted input', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([
      d('2026-07-11'), d('2026-07-09'), d('2026-07-10'),
    ]);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('currentStreak=0 when last log was yesterday-1 day ago', () => {
    pinToday('2026-07-11');
    // Last log was July 9 — two days ago
    const result = computeStreakFromDates([
      d('2026-07-07'), d('2026-07-08'), d('2026-07-09'),
    ]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3); // historical max preserved
  });

  it('correctly identifies longestStreak when current streak is longer than historical max', () => {
    pinToday('2026-07-11');
    // History: 1-2 (streak=2), then 8-11 (streak=4)
    const result = computeStreakFromDates([
      d('2026-07-01'), d('2026-07-02'),
      d('2026-07-08'), d('2026-07-09'), d('2026-07-10'), d('2026-07-11'),
    ]);
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });

  it('returns lastCompletedDate as the most recent date', () => {
    pinToday('2026-07-11');
    const result = computeStreakFromDates([
      d('2026-07-01'), d('2026-07-05'), d('2026-07-11'),
    ]);
    expect(result.lastCompletedDate).toEqual(d('2026-07-11'));
  });

  it('handles year-boundary correctly (Dec 31 → Jan 1)', () => {
    pinToday('2026-01-01');
    const result = computeStreakFromDates([d('2025-12-31'), d('2026-01-01')]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('handles month-boundary correctly (Jan 31 → Feb 1)', () => {
    pinToday('2026-02-01');
    const result = computeStreakFromDates([d('2026-01-31'), d('2026-02-01')]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('correctly recalculates after deleting the latest log', () => {
    pinToday('2026-07-11');
    // Simulate: had logs for 9-11, then user deleted July 11 log
    // Remaining logs: Jul 9 and Jul 10 — both count since Jul 10 = yesterday
    const result = computeStreakFromDates([d('2026-07-09'), d('2026-07-10')]);
    expect(result.currentStreak).toBe(2); // Jul 9-10 consecutive, Jul 10 = yesterday, still alive
    expect(result.longestStreak).toBe(2);
  });

  it('recalculates correctly after editing a middle log from completed to skipped', () => {
    pinToday('2026-07-11');
    // Had: Jul 8, 9, 10, 11 (streak=4)
    // After editing Jul 9 to skipped: remaining completed = Jul 8, 10, 11
    const result = computeStreakFromDates([d('2026-07-08'), d('2026-07-10'), d('2026-07-11')]);
    expect(result.currentStreak).toBe(2); // 10-11
    expect(result.longestStreak).toBe(2); // max after edit
  });
});
