import { z } from 'zod';

export const createGoalSchema = z.object({
  title:        z.string().min(1).max(300).trim(),
  description:  z.string().max(2000).optional(),
  category:     z.enum(['health','fitness','career','finance','relationships','learning','mental_health','self_care','other']),
  goalType:     z.enum(['short_term','medium_term','long_term']),
  progressType: z.enum(['percentage','checklist','numeric']).default('percentage'),
  targetValue:  z.number().positive().optional(),
  unit:         z.string().max(50).optional(),
  priority:     z.enum(['low','medium','high']).default('medium'),
  targetDate:   z.string().date().optional(),
  habitIds:     z.array(z.string().uuid()).max(20).default([]),
  milestones: z.array(z.object({
    title:       z.string().min(1).max(300).trim(),
    targetValue: z.number().optional(),
    targetDate:  z.string().date().optional(),
    notes:       z.string().max(500).optional(),
  })).max(20).default([]),
});

export const updateGoalSchema = createGoalSchema
  .omit({ milestones: true, habitIds: true })
  .partial();

export const updateGoalProgressSchema = z.object({
  progressPct:  z.number().min(0).max(100).optional(),
  currentValue: z.number().min(0).optional(),
});

export const createMilestoneSchema = z.object({
  title:       z.string().min(1).max(300).trim(),
  targetValue: z.number().optional(),
  targetDate:  z.string().date().optional(),
  sortOrder:   z.number().int().min(0).optional(),
  notes:       z.string().max(500).optional(),
});

export const listGoalsQuerySchema = z.object({
  status:   z.enum(['active','completed','abandoned']).optional(),
  category: z.enum(['health','fitness','career','finance','relationships','learning','mental_health','self_care','other']).optional(),
  type:     z.enum(['short_term','medium_term','long_term']).optional(),
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  sort:     z.enum(['targetDate','createdAt','priority','progressPct']).default('createdAt'),
  order:    z.enum(['asc','desc']).default('desc'),
});

export type CreateGoalInput          = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput          = z.infer<typeof updateGoalSchema>;
export type UpdateGoalProgressInput  = z.infer<typeof updateGoalProgressSchema>;
export type CreateMilestoneInput     = z.infer<typeof createMilestoneSchema>;
export type ListGoalsQuery           = z.infer<typeof listGoalsQuerySchema>;
