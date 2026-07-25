import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    if (err.statusCode >= 500) {
      logger.error('Operational server error', {
        requestId: req.requestId,
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
      requestId: req.requestId,
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const fields = (err.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'field';
      res.status(409).json({
        success: false,
        error: { code: ErrorCode.CONFLICT, message: `A record with this ${fields} already exists` },
        requestId: req.requestId,
      });
      return;
    }

    // Bad UUID in URL param
    if (err.message.includes('Error creating UUID')) {
      res.status(400).json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: 'Invalid ID format' },
        requestId: req.requestId,
      });
      return;
    }
  }

  // Prisma schema validation error
  if (err instanceof PrismaClientValidationError) {
    logger.warn('Prisma validation error', { requestId: req.requestId, path: req.path });
    res.status(400).json({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR, message: 'Invalid request data' },
      requestId: req.requestId,
    });
    return;
  }

  // Unexpected / non-operational error — never expose internals
  logger.error('Unexpected error', {
    requestId: req.requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(env.NODE_ENV === 'development' && err instanceof Error
        ? { debug: { message: err.message, stack: err.stack } }
        : {}),
    },
    requestId: req.requestId,
  });
}

/** Catch-all for 404s — must be registered after all routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    requestId: req.requestId,
  });
}
