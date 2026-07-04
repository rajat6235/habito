import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/crypto';
import { createRequestLogger } from '../config/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ?? generateRequestId();
  req.requestId = requestId;
  req.log = createRequestLogger(requestId);
  res.setHeader('X-Request-Id', requestId);
  next();
}
