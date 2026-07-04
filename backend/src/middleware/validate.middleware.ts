import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validate and parse a section of the Express request against a Zod schema.
 * Replaces req[part] with the parsed (coerced/transformed) value on success.
 */
export function validate<T>(schema: ZodSchema<T>, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const details = formatZodError(result.error);
      return next(
        new AppError({
          message: 'Validation failed',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details,
        }),
      );
    }

    // Replace with parsed/coerced value
    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}

function formatZodError(error: ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
