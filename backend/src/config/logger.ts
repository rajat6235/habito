import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const prettyFormat = printf(({ level, message, timestamp: ts, requestId, ...meta }) => {
  const rid = requestId ? ` [${requestId}]` : '';
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts}${rid} ${level}: ${message}${extra}`;
});

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isDev
      ? combine(colorize({ all: true }), prettyFormat)
      : json(),
  ),
  transports: [new winston.transports.Console()],
  // Never crash the process on unhandled logger errors
  exitOnError: false,
});

// Child logger factory — binds context fields to every log line
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({ requestId, userId });
}
