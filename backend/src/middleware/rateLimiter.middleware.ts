import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

const handler = (_req: Request, _res: Response, next: NextFunction) => {
  next(AppError.tooManyRequests('Too many requests. Please try again later.'));
};

/** General API rate limiter */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => req.ip ?? 'unknown',
});

/** Strict limiter for auth endpoints — prevents brute force */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => req.ip ?? 'unknown',
  skipSuccessfulRequests: true,
});

/** Very strict limiter for password reset / email verification */
export const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => req.ip ?? 'unknown',
});
