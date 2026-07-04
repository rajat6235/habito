import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';
import { AuthUser } from '../types/express';
import { RoleName } from '@prisma/client';

interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: RoleName[];
  sessionId: string;
  impersonatedBy?: string;
  iat: number;
  exp: number;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Access token expired', ErrorCode.TOKEN_EXPIRED);
    }
    throw AppError.unauthorized('Invalid access token', ErrorCode.TOKEN_INVALID);
  }
}

/** Require a valid access token. Attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token) {
    return next(AppError.unauthorized('No authentication token provided'));
  }

  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles,
    sessionId: payload.sessionId,
    isImpersonated: Boolean(payload.impersonatedBy),
  } satisfies AuthUser;

  if (payload.impersonatedBy) {
    req.impersonatingAdminId = payload.impersonatedBy;
  }

  next();
}

/** Like authenticate but does not throw if token is missing (for optional auth routes) */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
      isImpersonated: Boolean(payload.impersonatedBy),
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}
