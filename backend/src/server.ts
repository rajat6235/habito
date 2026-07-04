// Load .env before any validation runs
import 'dotenv/config';
// Must be second — validates env vars before anything else loads
import './config/env';

import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startJobs, stopJobs } from './jobs';
import { logger } from './config/logger';
import { env } from './config/env';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Server running`, {
      port: env.PORT,
      environment: env.NODE_ENV,
      url: env.APP_URL,
    });
  });

  startJobs();

  // ── Graceful shutdown ─────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    stopJobs();

    server.close(async (err) => {
      if (err) {
        logger.error('Error closing HTTP server', { err });
        process.exit(1);
      }

      try {
        await disconnectDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (dbErr) {
        logger.error('Error during database disconnect', { err: dbErr });
        process.exit(1);
      }
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    void shutdown('unhandledRejection');
  });
}

void bootstrap();
