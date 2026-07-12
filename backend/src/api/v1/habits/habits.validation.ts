import { z } from 'zod';

const customFieldTypeSchema = z.enum([
  'text', 'long_text', 'number', 'decimal',
  'dropdown', 'multi_select', 'checkbox',
  'date', 'time', 'rating', 'url',
]);

const customFieldDefSchema = z.object({
  id:                  z.string().min(1).max(36),
  name:                z.string().min(1, 'Field name is required').max(100).trim(),
  type:                customFieldTypeSchema,
  placeholder:         z.string().max(200).optional(),
  required:            z.boolean().optional(),
  showInHistory:       z.boolean().optional(),
  includeInAnalytics:  z.boolean().optional(),
  defaultValue:        z.string().max(500).optional(),
  options:             z.array(z.string().min(1).max(100)).max(50).optional(),
  validation: z.object({
    min:       z.number().optional(),
    max:       z.number().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
    pattern:   z.string().max(200).optional(),
  }).optional(),
});

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
  customFields:    z.array(customFieldDefSchema).max(50).optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const logHabitSchema = z.object({
  date:              z.string().date(),
  status:            z.enum(['completed', 'skipped', 'failed']),
  value:             z.number().positive().optional(),
  note:              z.string().max(500).optional(),
  skipReason:        z.string().max(200).optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
});

export const updateLogSchema = z.object({
  status:            z.enum(['completed', 'skipped', 'failed']).optional(),
  value:             z.number().positive().nullable().optional(),
  note:              z.string().max(500).nullable().optional(),
  skipReason:        z.string().max(200).nullable().optional(),
  customFieldValues: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const habitLogsQuerySchema = z.object({
  from:   z.string().date().optional(),
  to:     z.string().date().optional(),
  status: z.enum(['completed', 'skipped', 'failed']).optional(),
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
export type UpdateLogInput      = z.infer<typeof updateLogSchema>;
export type ListHabitsQuery     = z.infer<typeof listHabitsQuerySchema>;
export type HabitLogsQuery      = z.infer<typeof habitLogsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
