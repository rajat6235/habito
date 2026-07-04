import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search:   z.string().max(200).optional(),
  status:   z.enum(['active','disabled','deleted']).optional(),
  role:     z.enum(['super_admin','admin','moderator','user']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  sort:     z.enum(['createdAt','lastLoginAt','email']).default('createdAt'),
  order:    z.enum(['asc','desc']).default('desc'),
});

export const updateUserAdminSchema = z.object({
  status:  z.enum(['active','disabled']).optional(),
  role:    z.enum(['super_admin','admin','moderator','user']).optional(),
});

export const impersonateSchema = z.object({
  reason:         z.string().min(10).max(1000),
  reasonCategory: z.enum(['bug_investigation','user_support','data_verification','other']),
});

export const updateFeatureFlagSchema = z.object({
  isEnabled:  z.boolean().optional(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
  config:     z.record(z.unknown()).optional(),
});

export const updateGlobalSettingSchema = z.object({
  value: z.unknown(),
});

export const listAuditLogsQuerySchema = z.object({
  actorId:    z.string().uuid().optional(),
  entityType: z.string().optional(),
  action:     z.string().optional(),
  from:       z.string().date().optional(),
  to:         z.string().date().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});

export const updateFeedbackSchema = z.object({
  status:    z.enum(['open','reviewing','resolved','closed']).optional(),
  adminNote: z.string().max(2000).optional(),
});

export type ListUsersQuery          = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserAdminInput    = z.infer<typeof updateUserAdminSchema>;
export type ImpersonateInput        = z.infer<typeof impersonateSchema>;
export type UpdateFeatureFlagInput  = z.infer<typeof updateFeatureFlagSchema>;
export type ListAuditLogsQuery      = z.infer<typeof listAuditLogsQuerySchema>;
export type UpdateFeedbackInput     = z.infer<typeof updateFeedbackSchema>;
