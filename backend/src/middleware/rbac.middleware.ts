import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

/** Require one of the given roles. Must be used after authenticate(). */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return next(AppError.forbidden('Insufficient role', ErrorCode.INSUFFICIENT_PERMISSIONS));
    }

    next();
  };
}

/** Require the requesting user to own the resource (userId param must match req.user.id) */
export function requireOwnership(paramName = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    const targetId = req.params[paramName];
    const isAdmin = req.user.roles.includes('admin') || req.user.roles.includes('super_admin');

    if (targetId !== req.user.id && !isAdmin) {
      return next(AppError.forbidden());
    }

    next();
  };
}

/** Shorthand — require super_admin role */
export const requireSuperAdmin = requireRole('super_admin');

/** Shorthand — require admin or super_admin */
export const requireAdmin = requireRole('admin', 'super_admin');

/** Shorthand — require moderator, admin, or super_admin */
export const requireModerator = requireRole('moderator', 'admin', 'super_admin');
