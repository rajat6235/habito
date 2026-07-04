import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  type:     z.enum(['habit_reminder','recovery_checkin','streak_at_risk','goal_deadline','journal_prompt','achievement','weekly_recap','system','pr_record']).optional(),
  isRead:   z.enum(['true','false']).transform(v => v === 'true').optional(),
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type PushSubscriptionInput  = z.infer<typeof pushSubscriptionSchema>;
