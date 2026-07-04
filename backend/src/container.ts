/**
 * Dependency Injection Container
 *
 * Manual DI — no framework. Each service is constructed once and
 * shared across request handlers via this singleton container.
 * Repositories and services are wired here, not in controllers.
 */

import { prisma } from './config/database';

// Repositories
import { UserRepository } from './repositories/user.repository';
import { SessionRepository } from './repositories/session.repository';
import { HabitRepository } from './repositories/habit.repository';

// Services
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { StorageService } from './services/storage.service';

// ── Instantiate Repositories ──────────────────────────────────────

const userRepository = new UserRepository(prisma);
const sessionRepository = new SessionRepository(prisma);
const habitRepository = new HabitRepository(prisma);

// ── Instantiate Services ──────────────────────────────────────────

const emailService = new EmailService();
const storageService = new StorageService();
const authService = new AuthService(userRepository, sessionRepository);

// ── Export Container ──────────────────────────────────────────────

export const container = {
  // Repositories
  userRepository,
  sessionRepository,
  habitRepository,

  // Services
  authService,
  emailService,
  storageService,
} as const;

export type Container = typeof container;
