import { describe, it, expect } from 'vitest';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

describe('AppError static factory methods', () => {
  it('badRequest returns 400', () => {
    const e = AppError.badRequest('bad');
    expect(e.statusCode).toBe(400);
    expect(e.message).toBe('bad');
    expect(e.isOperational).toBe(true);
  });

  it('unauthorized returns 401', () => {
    const e = AppError.unauthorized('unauth');
    expect(e.statusCode).toBe(401);
  });

  it('forbidden returns 403', () => {
    const e = AppError.forbidden('forbid');
    expect(e.statusCode).toBe(403);
  });

  it('notFound returns 404 with default message', () => {
    const e = AppError.notFound('Widget');
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('Widget');
  });

  it('conflict returns 409', () => {
    const e = AppError.conflict('dupe');
    expect(e.statusCode).toBe(409);
  });

  it('tooManyRequests returns 429', () => {
    const e = AppError.tooManyRequests('slow down');
    expect(e.statusCode).toBe(429);
  });

  it('internal returns 500', () => {
    const e = AppError.internal('boom');
    expect(e.statusCode).toBe(500);
  });

  it('preserves error code when provided', () => {
    const e = AppError.unauthorized('bad creds', ErrorCode.INVALID_CREDENTIALS);
    expect(e.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('is an instanceof Error', () => {
    expect(AppError.notFound('X')).toBeInstanceOf(Error);
  });

  it('is an instanceof AppError', () => {
    expect(AppError.notFound('X')).toBeInstanceOf(AppError);
  });
});
