import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import { auditLog } from '../../../middleware/audit.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateSettingsSchema,
} from './users.validation';
import {
  getMe,
  updateMe,
  changePassword,
  getSettings,
  updateSettings,
  getSessions,
  terminateSession,
} from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getMe);

usersRouter.patch('/me', authenticate, validate(updateProfileSchema), updateMe);

usersRouter.post(
  '/me/change-password',
  authenticate,
  validate(changePasswordSchema),
  auditLog({ action: 'user.password_changed' }),
  changePassword,
);

usersRouter.get('/me/settings', authenticate, getSettings);

usersRouter.patch('/me/settings', authenticate, validate(updateSettingsSchema), updateSettings);

usersRouter.get('/me/sessions', authenticate, getSessions);

usersRouter.delete(
  '/me/sessions/:id',
  authenticate,
  auditLog({ action: 'user.session_terminated' }),
  terminateSession,
);
