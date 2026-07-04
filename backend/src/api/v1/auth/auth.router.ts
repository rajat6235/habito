import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import { authRateLimiter, sensitiveRateLimiter } from '../../../middleware/rateLimiter.middleware';
import { auditLog } from '../../../middleware/audit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';
import {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from './auth.controller';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  auditLog({ action: 'user.register' }),
  register,
);

authRouter.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  auditLog({ action: 'user.login' }),
  login,
);

authRouter.post(
  '/refresh',
  refreshToken,
);

authRouter.post(
  '/logout',
  authenticate,
  auditLog({ action: 'user.logout' }),
  logout,
);

authRouter.post(
  '/logout-all',
  authenticate,
  auditLog({ action: 'user.logout_all' }),
  logoutAll,
);

authRouter.get(
  '/verify-email/:token',
  sensitiveRateLimiter,
  auditLog({ action: 'user.email_verified' }),
  verifyEmail,
);

authRouter.post(
  '/forgot-password',
  sensitiveRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

authRouter.post(
  '/reset-password',
  sensitiveRateLimiter,
  validate(resetPasswordSchema),
  auditLog({ action: 'user.password_reset' }),
  resetPassword,
);
