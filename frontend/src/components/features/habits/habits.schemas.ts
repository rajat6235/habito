import { z } from 'zod';

export const createHabitSchema = z.object({
  title:       z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId:  z.string().optional(),
  icon:        z.string().max(8).optional(),
  color:       z.preprocess(
    (v) => (typeof v === 'string' && v === '' ? undefined : v),
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid colour').optional(),
  ),
  habitType:   z.enum(['regular', 'event']).default('regular'),
  timesPerDay: z.preprocess(
    (v) => {
      if (v === '' || v === undefined || v === null) return 1;
      const n = Number(v);
      return Number.isNaN(n) ? 1 : n;
    },
    z.number().int().min(1).max(20),
  ),
  // Only meaningful when timesPerDay > 1 — 'all' means every completion is required
  // (today's behaviour), 'minimum' lets the habit count as done before the max is hit.
  completionType: z.enum(['all', 'minimum']).default('all'),
  minRequired: z.preprocess(
    (v) => {
      if (v === '' || v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number().int().min(1).max(20).optional(),
  ),
  // Event-based habits only — optionally seed the first log so "last done" isn't blank
  // immediately after creating a habit for something the user has obviously done before.
  lastDoneOn: z.string().optional(),
});

export const logHabitSchema = z.object({
  note:              z.string().max(500).optional(),
  value:             z.coerce.number().positive().optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
});

export const editLogSchema = z.object({
  status:            z.enum(['completed', 'skipped', 'failed', 'partial']).optional(),
  note:              z.string().max(500).optional().nullable(),
  value:             z.coerce.number().positive().optional().nullable(),
  customFieldValues: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateHabitForm = z.infer<typeof createHabitSchema>;
export type LogHabitForm    = z.infer<typeof logHabitSchema>;
export type EditLogForm     = z.infer<typeof editLogSchema>;
