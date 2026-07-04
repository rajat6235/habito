export interface AppErrorOptions {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: unknown;
  /** Operational errors are expected (validation, auth). Non-operational = programmer error. */
  public readonly isOperational: boolean;

  constructor({ message, code, statusCode, details, isOperational = true }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new AppError({ message, code, statusCode: 400, details });
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new AppError({ message, code, statusCode: 401 });
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
    return new AppError({ message, code, statusCode: 403 });
  }

  static notFound(resource = 'Resource', code = 'NOT_FOUND') {
    return new AppError({ message: `${resource} not found`, code, statusCode: 404 });
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new AppError({ message, code, statusCode: 409 });
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new AppError({ message, code, statusCode: 429 });
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new AppError({ message, code, statusCode: 500, isOperational: false });
  }
}
