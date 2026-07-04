import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ActorType } from '@prisma/client';
import { logger } from '../config/logger';

interface AuditOptions {
  action: string;
  entityType?: string;
  getEntityId?: (req: Request) => string | undefined;
  getNewValue?: (req: Request, res: Response) => unknown;
}

/**
 * Factory that returns Express middleware recording an immutable audit log entry.
 * Designed to be placed AFTER the route handler via a response-finish hook.
 * Only logs successful responses (2xx).
 */
export function auditLog(options: AuditOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      const actorType: ActorType = req.user ? 'user' : 'system';
      const entityId = options.getEntityId?.(req);

      prisma.auditLog
        .create({
          data: {
            actorId: req.user?.id ?? null,
            actorType,
            action: options.action,
            entityType: options.entityType ?? null,
            entityId: entityId ?? null,
            ipAddress: req.ip ?? null,
            userAgent: req.get('user-agent') ?? null,
            requestId: req.requestId as string,
            metadata: {
              method: req.method,
              path: req.path,
              isImpersonated: req.user?.isImpersonated ?? false,
              impersonatingAdminId: req.impersonatingAdminId ?? null,
            },
          },
        })
        .catch(err => {
          logger.error('Failed to write audit log', { error: err, action: options.action });
        });
    });

    next();
  };
}
