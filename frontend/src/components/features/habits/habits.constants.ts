export const PRESET_ICONS  = ['🏃', '🧘', '📚', '💧', '🏋️', '🌅', '✍️', '🎯', '🍎', '😴'] as const;

export const PRESET_COLORS = [
  '#6d60f0', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
] as const;

export const FILTER_TABS = [
  { key: 'all',     label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'done',    label: 'Done' },
] as const;

export type FilterKey = (typeof FILTER_TABS)[number]['key'];

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.4, 0.25, 1] } },
};
