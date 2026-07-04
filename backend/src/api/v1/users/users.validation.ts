import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName:  z.string().min(1).max(100).trim().optional(),
  lastName:   z.string().max(100).trim().optional(),
  username:   z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio:        z.string().max(500).trim().optional(),
  birthday:   z.string().date().optional(),
  timezone:   z.string().min(1).max(100).optional(),
  theme:      z.enum(['light', 'dark', 'system']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword:  z.string().min(1),
  newPassword: z
    .string()
    .min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string().min(1),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateSettingsSchema = z.object({
  notificationPrefs: z.record(z.unknown()).optional(),
  privacySettings:   z.record(z.unknown()).optional(),
  dashboardLayout:   z.array(z.unknown()).optional(),
  plannerConfig:     z.record(z.unknown()).optional(),
  gymConfig:         z.record(z.unknown()).optional(),
});

export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
