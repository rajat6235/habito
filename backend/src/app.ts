import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import { prisma } from './config/database';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { v1Router } from './api/v1';
import { logger } from './config/logger';

export function createApp(): express.Application {
  const app = express();

  // ── Trust proxy (for correct IP behind load balancers / Nginx) ──
  app.set('trust proxy', 1);

  // ── Security headers ──────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: [env.CLIENT_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    }),
  );

  // ── Compression ───────────────────────────────────────────────────
  app.use(compression());

  // ── Body parsing ──────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Request ID + per-request logger ──────────────────────────────
  app.use(requestIdMiddleware);

  // ── HTTP request logging ──────────────────────────────────────────
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.http(`${req.method} ${req.path} ${res.statusCode}`, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
      });
    });
    next();
  });

  // ── Rate limiting ─────────────────────────────────────────────────
  app.use('/api/', apiRateLimiter);

  // ── Health check (no auth, no rate limit) ────────────────────────
  app.get('/health', async (_req, res) => {
    const timestamp = new Date().toISOString();
    const version   = process.env['npm_package_version'] ?? '1.0.0';

    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', timestamp, version, environment: env.NODE_ENV, db: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', timestamp, version, environment: env.NODE_ENV, db: 'unavailable' });
    }
  });

  // ── API v1 routes ─────────────────────────────────────────────────
  app.use('/api/v1', v1Router);

  // ── 404 handler ───────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last) ──────────────────────────
  app.use(errorHandler);

  return app;
}
