import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { RecoveryGoal, RelapseLog } from '@/lib/api/recovery.api';

export const MILESTONE_DAYS = [7, 30, 60, 90, 180, 365] as const;

export interface StreakSegment {
  startDate: Date;
  endDate:   Date | null; // the relapse date that ended it, or null if still ongoing
  days:      number;
  status:    'relapsed' | 'current';
  relapse:   RelapseLog | null;
}

/** Reconstructs every streak segment (recovery run) from the goal's start date and its relapse history. */
export function buildStreakSegments(goal: RecoveryGoal, relapses: RelapseLog[]): StreakSegment[] {
  const sorted = [...relapses].sort(
    (a, b) => new Date(a.relapsedAt).getTime() - new Date(b.relapsedAt).getTime(),
  );

  const segments: StreakSegment[] = [];
  let segmentStart = startOfDay(new Date(goal.startDate));

  for (const relapse of sorted) {
    const relapseDate = startOfDay(new Date(relapse.relapsedAt));
    segments.push({
      startDate: segmentStart,
      endDate:   relapseDate,
      days:      relapse.streakBroken,
      status:    'relapsed',
      relapse,
    });
    segmentStart = relapseDate;
  }

  segments.push({
    startDate: segmentStart,
    endDate:   null,
    days:      goal.currentStreakDays,
    status:    'current',
    relapse:   null,
  });

  return segments;
}

export function computeAverageStreakDays(segments: StreakSegment[]): number {
  const completed = segments.filter((s) => s.status === 'relapsed');
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, s) => sum + s.days, 0);
  return Math.round((total / completed.length) * 10) / 10;
}

/** 1-indexed day-of-streak for a given date within a segment ("Day 1" is the segment's start date). */
export function dayNumberInSegment(date: Date, segment: StreakSegment): number {
  return differenceInCalendarDays(startOfDay(date), segment.startDate) + 1;
}

export function isMilestoneDayNumber(dayNumber: number): boolean {
  return (MILESTONE_DAYS as readonly number[]).includes(dayNumber);
}

export type RecoveryDayStatus = 'before-start' | 'relapse' | 'milestone' | 'recovery' | null;

export interface RecoveryDayInfo {
  status:     RecoveryDayStatus;
  segment:    StreakSegment | null;
  dayNumber:  number | null;
  relapse:    RelapseLog | null;
}

/** Resolves a single calendar day's status against a precomputed list of segments. */
export function getRecoveryDayInfo(day: Date, goal: RecoveryGoal, segments: StreakSegment[]): RecoveryDayInfo {
  const target = startOfDay(day);
  const start  = startOfDay(new Date(goal.startDate));
  const today  = startOfDay(new Date());

  if (target < start) return { status: 'before-start', segment: null, dayNumber: null, relapse: null };
  if (target > today) return { status: null, segment: null, dayNumber: null, relapse: null };

  // A relapse date always displays as the relapse itself, even though it's also the
  // start-of-day boundary for the next segment.
  const relapsedSegment = segments.find(
    (s) => s.status === 'relapsed' && s.endDate && startOfDay(s.endDate).getTime() === target.getTime(),
  );
  if (relapsedSegment) {
    return { status: 'relapse', segment: relapsedSegment, dayNumber: relapsedSegment.days, relapse: relapsedSegment.relapse };
  }

  const segment = segments.find((s) => {
    const end = s.endDate ?? today;
    return target >= s.startDate && target <= end;
  });
  if (!segment) return { status: null, segment: null, dayNumber: null, relapse: null };

  const dayNumber = dayNumberInSegment(target, segment);
  return {
    status:    isMilestoneDayNumber(dayNumber) ? 'milestone' : 'recovery',
    segment,
    dayNumber,
    relapse: null,
  };
}
