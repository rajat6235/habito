import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  period: z.enum(['day','week','month','year']).default('week'),
  from:   z.string().date().optional(),
  to:     z.string().date().optional(),
});

export const habitAnalyticsQuerySchema = analyticsQuerySchema.extend({
  habitId: z.string().uuid().optional(),
});

export type AnalyticsQuery       = z.infer<typeof analyticsQuerySchema>;
export type HabitAnalyticsQuery  = z.infer<typeof habitAnalyticsQuerySchema>;
