import { z } from 'zod';

export const createHabitSchema = z.object({
  title:       z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  categoryId:  z.string().optional(),
  icon:        z.string().max(8).optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid colour').optional(),
  timesPerDay: z.coerce.number().int().min(1).max(20).default(1),
});

export const logHabitSchema = z.object({
  note:              z.string().max(500).optional(),
  value:             z.coerce.number().positive().optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
});

export const editLogSchema = z.object({
  status:            z.enum(['completed', 'skipped', 'failed']).optional(),
  note:              z.string().max(500).optional().nullable(),
  value:             z.coerce.number().positive().optional().nullable(),
  customFieldValues: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateHabitForm = z.infer<typeof createHabitSchema>;
export type LogHabitForm    = z.infer<typeof logHabitSchema>;
export type EditLogForm     = z.infer<typeof editLogSchema>;
