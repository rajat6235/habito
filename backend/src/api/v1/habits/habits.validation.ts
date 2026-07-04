import { z } from 'zod';

const frequencyConfigSchema = z.union([
  z.object({ type: z.literal('daily') }),
  z.object({ type: z.literal('twice_daily') }),
  z.object({ type: z.literal('custom_daily'), timesPerDay: z.number().int().min(1).max(20) }),
  z.object({ type: z.literal('weekly'), days: z.array(z.number().int().min(0).max(6)).min(1) }),
  z.object({ type: z.literal('monthly'), dates: z.array(z.number().int().min(1).max(31)).min(1) }),
  z.object({ type: z.literal('every_x_hours'), intervalHours: z.number().int().min(1).max(23) }),
  z.object({ type: z.literal('quantity'), target: z.number().positive(), unit: z.string().max(50) }),
  z.object({ type: z.literal('time_based'), targetMinutes: z.number().int().min(1) }),
]);

const reminderConfigSchema = z.object({
  time:     z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  days:     z.array(z.number().int().min(0).max(6)).optional(),
  channels: z.array(z.enum(['inApp', 'email', 'push'])).default(['inApp']),
});

export const createHabitSchema = z.object({
  title:           z.string().min(1).max(200).trim(),
  description:     z.string().max(1000).trim().optional(),
  categoryId:      z.string().uuid().optional(),
  icon:            z.string().max(100).optional(),
  color:           z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  frequencyConfig: frequencyConfigSchema,
  priority:        z.enum(['low', 'medium', 'high']).default('medium'),
  reminderEnabled: z.boolean().default(false),
  reminderConfig:  reminderConfigSchema.optional(),
  startDate:       z.string().date().optional(),
  endDate:         z.string().date().optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const logHabitSchema = z.object({
  date:       z.string().date(),
  status:     z.enum(['completed', 'skipped', 'failed']),
  value:      z.number().positive().optional(),
  note:       z.string().max(500).optional(),
  skipReason: z.string().max(200).optional(),
});

export const habitLogsQuerySchema = z.object({
  from:   z.string().date(),
  to:     z.string().date(),
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(30),
});

export const listHabitsQuerySchema = z.object({
  archived:   z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  categoryId: z.string().uuid().optional(),
  cursor:     z.string().optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});

export const createCategorySchema = z.object({
  name:      z.string().min(1).max(100).trim(),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon:      z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateHabitInput    = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput    = z.infer<typeof updateHabitSchema>;
export type LogHabitInput       = z.infer<typeof logHabitSchema>;
export type ListHabitsQuery     = z.infer<typeof listHabitsQuerySchema>;
export type HabitLogsQuery      = z.infer<typeof habitLogsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
