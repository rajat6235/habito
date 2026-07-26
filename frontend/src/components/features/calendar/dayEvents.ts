import type { CalendarDay } from '@shared/types/api.types';
import type { CalendarModule } from './calendar.constants';

// Every module on the calendar contributes DayEvents through one small adapter
// function below. Rendering code (month cell, week card, day timeline) only
// ever reads DayEvent[] — it never branches on which module produced them.

export type EventModule = 'habits' | 'event-habit' | 'recovery' | 'expenses' | 'planner' | 'journal' | 'mood' | 'notes';
export type NotableKind = 'relapse' | 'milestone' | 'perfect' | null;
export type Tone = 'good' | 'bad' | 'neutral';

export interface DayEvent {
  id:       string;
  module:   EventModule;
  time:     string | null;   // ISO datetime when known — drives the day-timeline order
  priority: number;          // higher wins the month headline / ranks the week top-3
  headline: string;          // short, literal, no icon-decoding required
  icon:     string;
  detail?:  string;
  value?:   string;
  tone:     Tone;
  notable?: NotableKind;
  // Optional raw number behind the headline (streak length, amount, count) so
  // month insights can aggregate (max/sum) without parsing display text.
  metric?:  number;
}

export const PRIORITY = {
  relapse:      100,
  milestone:    90,
  perfectDay:   85,
  recovery:     45,
  eventHabit:   40,
  expenseHigh:  35,
  habitPartial: 25,
  planner:      20,
  journal:      15,
  expenseLow:   14,
  notes:        12,
  mood:         8,
} as const;

const EXPENSE_HIGH_THRESHOLD = 300;

// Which filter chip governs each module. `null` means "always shown" — there's
// no dedicated chip for it yet, and it's low-priority enough not to need one.
export const FILTER_KEY_FOR_MODULE: Record<EventModule, CalendarModule | null> = {
  habits: 'habits',
  'event-habit': 'event',
  recovery: 'recovery',
  expenses: 'expenses',
  planner: 'planner',
  journal: 'journal',
  mood: 'journal',
  notes: null,
};

// ── Per-module adapters ─────────────────────────────────────────────────────

export function habitEvents(day: CalendarDay): DayEvent[] {
  if (day.habitsScheduled === 0) return [];
  const allDone = day.habitCompletionPct === 100;
  return [{
    id: `habits-${day.date}`,
    module: 'habits',
    time: null,
    priority: allDone ? PRIORITY.perfectDay : PRIORITY.habitPartial,
    headline: allDone ? 'All habits done' : `${day.habitsCompleted}/${day.habitsScheduled} habits`,
    icon: allDone ? '✅' : '◐',
    tone: allDone ? 'good' : 'neutral',
  }];
}

export function journalEvents(day: CalendarDay): DayEvent[] {
  if (!day.journalWritten) return [];
  return [{ id: `journal-${day.date}`, module: 'journal', time: null, priority: PRIORITY.journal, headline: 'Journal written', icon: '📖', tone: 'neutral' }];
}

function describeMood(mood: number): { label: string; emoji: string; tone: Tone } {
  if (mood >= 8) return { label: 'Great', emoji: '😊', tone: 'good' };
  if (mood >= 6) return { label: 'Good',  emoji: '🙂', tone: 'good' };
  if (mood >= 4) return { label: 'Okay',  emoji: '😐', tone: 'neutral' };
  return { label: 'Low', emoji: '😕', tone: 'bad' };
}

export function moodEvents(day: CalendarDay): DayEvent[] {
  const mood = day.moodMorning ?? day.moodEvening;
  if (mood == null) return [];
  const { label, emoji, tone } = describeMood(mood);
  return [{ id: `mood-${day.date}`, module: 'mood', time: null, priority: PRIORITY.mood, headline: `Mood ${label}`, icon: emoji, tone }];
}

export function plannerEvents(day: CalendarDay): DayEvent[] {
  if (day.tasksScheduled === 0) return [];
  const done = day.tasksCompleted === day.tasksScheduled;
  return [{ id: `planner-${day.date}`, module: 'planner', time: null, priority: PRIORITY.planner, headline: `${day.tasksCompleted}/${day.tasksScheduled} tasks`, icon: '☑', tone: done ? 'good' : 'neutral' }];
}

export function notesEvents(day: CalendarDay): DayEvent[] {
  if (!day.notesCreated) return [];
  return [{ id: `notes-${day.date}`, module: 'notes', time: null, priority: PRIORITY.notes, headline: `${day.notesCreated} note${day.notesCreated > 1 ? 's' : ''}`, icon: '✎', tone: 'neutral' }];
}

export function recoveryEvent(dateStr: string, status: 'relapse' | 'milestone' | 'recovery', dayNumber: number | null): DayEvent {
  if (status === 'relapse') {
    return { id: `recovery-${dateStr}`, module: 'recovery', time: null, priority: PRIORITY.relapse, headline: 'Relapse', icon: '💔', tone: 'bad', notable: 'relapse' };
  }
  if (status === 'milestone') {
    return { id: `recovery-${dateStr}`, module: 'recovery', time: null, priority: PRIORITY.milestone, headline: `Milestone · Day ${dayNumber}`, icon: '🏆', tone: 'good', notable: 'milestone', metric: dayNumber ?? undefined };
  }
  return { id: `recovery-${dateStr}`, module: 'recovery', time: null, priority: PRIORITY.recovery, headline: `Recovery · Day ${dayNumber}`, icon: '🔥', tone: 'good', metric: dayNumber ?? undefined };
}

export function eventHabitEvent(dateStr: string, habitId: string, habitTitle: string, habitIcon: string | null, time: string | null): DayEvent {
  return { id: `event-${dateStr}-${habitId}`, module: 'event-habit', time, priority: PRIORITY.eventHabit, headline: habitTitle, icon: habitIcon ?? '🔁', tone: 'good', metric: 1 };
}

export function expenseEvent(dateStr: string, total: number): DayEvent {
  const high = total >= EXPENSE_HIGH_THRESHOLD;
  return { id: `expenses-${dateStr}`, module: 'expenses', time: null, priority: high ? PRIORITY.expenseHigh : PRIORITY.expenseLow, headline: `₹${total} spent`, icon: '💰', tone: 'neutral', metric: total };
}

// ── Aggregation ──────────────────────────────────────────────────────────────

export interface DayCellData {
  score:    number | null;
  headline: string | null;
  notable:  NotableKind;
  events:   DayEvent[];
}

/**
 * Builds one day's full event list and derives the ranked headline, notable
 * state, and life score from it. `moduleEvents` carries whatever the calendar
 * hook already computed for modules with per-day fetches (recovery, event-based
 * habits, expenses); the rest come straight off the CalendarDay aggregate.
 */
export function buildDayCell(day: CalendarDay, moduleEvents: DayEvent[], active: Set<CalendarModule>): DayCellData {
  const allowed = (m: EventModule) => {
    const key = FILTER_KEY_FOR_MODULE[m];
    return key === null || active.has(key);
  };

  const events: DayEvent[] = [
    ...(allowed('habits')  ? habitEvents(day)  : []),
    ...(allowed('journal') ? journalEvents(day) : []),
    ...(allowed('mood')    ? moodEvents(day)    : []),
    ...(allowed('planner') ? plannerEvents(day) : []),
    ...(allowed('notes')   ? notesEvents(day)   : []),
    ...moduleEvents.filter((e) => allowed(e.module)),
  ];

  const hasRelapse = events.some((e) => e.notable === 'relapse');
  if (events.length === 0) return { score: null, headline: null, notable: null, events: [] };

  const score = computeLifeScore(day, events, hasRelapse);

  // "Perfect day" is tied to the score itself, not just habits — so the ring
  // and the badge never disagree (a 100% habit day with half the tasks done
  // isn't a perfect day; the ring would show it plainly either way).
  if (!hasRelapse && day.habitsScheduled > 0 && score === 100) {
    events.push({ id: `perfect-${day.date}`, module: 'habits', time: null, priority: PRIORITY.perfectDay, headline: 'Perfect day', icon: '⭐', tone: 'good', notable: 'perfect' });
  }

  const top = [...events].sort((a, b) => b.priority - a.priority)[0]!;
  const notable = events.find((e) => e.notable === 'relapse')?.notable
    ?? events.find((e) => e.notable === 'milestone')?.notable
    ?? events.find((e) => e.notable === 'perfect')?.notable
    ?? null;

  return { score, headline: top.headline, notable, events };
}

/** Blends whatever was actually tracked that day — a quiet habit day with a clean recovery streak isn't "0%". */
export function computeLifeScore(day: CalendarDay, events: DayEvent[], hasRelapse: boolean): number {
  if (hasRelapse) return 0;
  const parts: number[] = [];
  if (day.habitsScheduled > 0) parts.push(day.habitCompletionPct);
  if (day.tasksScheduled  > 0) parts.push((day.tasksCompleted / day.tasksScheduled) * 100);
  if (events.some((e) => e.module === 'recovery')) parts.push(100);
  if (parts.length > 0) return Math.round(parts.reduce((s, p) => s + p, 0) / parts.length);
  if (day.journalWritten || events.some((e) => e.module === 'event-habit')) return 65;
  return 0;
}
