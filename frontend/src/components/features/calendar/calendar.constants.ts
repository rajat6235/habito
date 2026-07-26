export type CalendarModule = 'habits' | 'event' | 'recovery' | 'journal' | 'expenses' | 'planner';

export const CALENDAR_MODULES: { key: CalendarModule; label: string; dot: string }[] = [
  { key: 'habits',   label: 'Habits',       dot: 'bg-violet-500' },
  { key: 'event',    label: 'Event-based',  dot: 'bg-teal-500' },
  { key: 'recovery', label: 'Recovery',     dot: 'bg-rose-500' },
  { key: 'journal',  label: 'Journal',      dot: 'bg-blue-500' },
  { key: 'expenses', label: 'Expenses',     dot: 'bg-fuchsia-500' },
  { key: 'planner',  label: 'Planner',      dot: 'bg-orange-400' },
];

export const ALL_CALENDAR_MODULES: Set<CalendarModule> = new Set(CALENDAR_MODULES.map(m => m.key));
