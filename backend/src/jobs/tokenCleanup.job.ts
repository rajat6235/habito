import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function tokenCleanupJob(): Promise<void> {
  const now = new Date();

  const [tokens, sessions, emailTokens, resetTokens] = await Promise.all([
    prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: now }, usedAt: null },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: now }, usedAt: null },
    }),
  ]);

  logger.info('Token cleanup complete', {
    refreshTokensDeleted: tokens.count,
    sessionsDeleted: sessions.count,
    emailTokensDeleted: emailTokens.count,
    resetTokensDeleted: resetTokens.count,
  });
}
