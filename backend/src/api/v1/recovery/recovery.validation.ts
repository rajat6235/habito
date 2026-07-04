import { z } from 'zod';

export const createRecoveryGoalSchema = z.object({
  name:         z.string().min(1).max(200).trim(),
  presetType:   z.enum([
    'no_smoking','no_alcohol','no_sugar','no_social_media',
    'no_gambling','no_junk_food','no_caffeine','custom',
  ]).optional(),
  icon:          z.string().max(100).optional(),
  color:         z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  personalWhy:   z.string().max(2000).optional(),
  emergencyPlan: z.string().max(2000).optional(),
  startDate:     z.string().datetime().optional(),
});

export const updateRecoveryGoalSchema = createRecoveryGoalSchema
  .omit({ startDate: true })
  .partial();

export const logRelapseSchema = z.object({
  relapsedAt:  z.string().datetime().optional(),
  moodBefore:  z.number().int().min(1).max(10).optional(),
  triggers:    z.array(z.string().max(100)).max(10).default([]),
  location:    z.string().max(100).optional(),
  notes:       z.string().max(2000).optional(),
  planForNext: z.string().max(2000).optional(),
});

export type CreateRecoveryGoalInput = z.infer<typeof createRecoveryGoalSchema>;
export type UpdateRecoveryGoalInput = z.infer<typeof updateRecoveryGoalSchema>;
export type LogRelapseInput         = z.infer<typeof logRelapseSchema>;
