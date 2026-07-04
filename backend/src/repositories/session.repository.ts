import { PrismaClient, Session, RefreshToken } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SessionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async createSession(data: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    deviceName?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return this.db.session.create({ data });
  }

  async findActiveSession(sessionId: string): Promise<Session | null> {
    return this.db.session.findFirst({
      where: { id: sessionId, expiresAt: { gt: new Date() } },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.session.delete({ where: { id: sessionId } }).catch(() => {});
  }

  async deleteAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    await this.db.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}),
      },
    });
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.db.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActive: 'desc' },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.db.session.update({
      where: { id: sessionId },
      data: { lastActive: new Date() },
    });
  }

  // ── Refresh Tokens ───────────────────────────────────────────────

  async createRefreshToken(data: {
    sessionId: string;
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({ where: { tokenHash } });
  }

  async rotateRefreshToken(
    oldTokenId: string,
    newTokenHash: string,
    newExpiresAt: Date,
  ): Promise<RefreshToken> {
    const old = await this.db.refreshToken.findUniqueOrThrow({ where: { id: oldTokenId } });

    await this.db.refreshToken.update({
      where: { id: oldTokenId },
      data: { usedAt: new Date(), revoked: true },
    });

    return this.db.refreshToken.create({
      data: {
        sessionId: old.sessionId,
        userId: old.userId,
        tokenHash: newTokenHash,
        family: old.family,
        rotationCounter: old.rotationCounter + 1,
        expiresAt: newExpiresAt,
      },
    });
  }

  async revokeFamily(family: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { family },
      data: { revoked: true },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.db.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
