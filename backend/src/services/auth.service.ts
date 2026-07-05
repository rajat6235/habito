import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import ms from 'ms';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';
import { hashPassword, verifyPassword, hashToken, generateSecureToken } from '../utils/crypto';
import { normaliseEmail } from '../utils/sanitize';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { prisma } from '../config/database';
import { RoleName } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends TokenPair {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    username: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    roles: RoleName[];
  };
  sessionId: string;
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    username: string;
  }): Promise<{ userId: string }> {
    const email = normaliseEmail(data.email);

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepo.findByEmail(email),
      this.userRepo.findByUsername(data.username),
    ]);

    if (existingEmail) {
      throw AppError.conflict('An account with this email already exists', ErrorCode.EMAIL_ALREADY_EXISTS);
    }
    if (existingUsername) {
      throw AppError.conflict('Username is already taken', ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    const passwordHash = await hashPassword(data.password);
    const userRole = await prisma.role.findUniqueOrThrow({ where: { name: 'user' } });

    const user = await this.userRepo.create({
      email,
      username:      data.username,
      passwordHash,
      firstName:     data.firstName,
      lastName:      data.lastName ?? null,
      emailVerified: true,
      roles:         { create: { roleId: userRole.id } },
      settings:      { create: {} },
    });

    return { userId: user.id };
  }

  async login(data: {
    email: string;
    password: string;
    rememberMe: boolean;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<LoginResult> {
    const email = normaliseEmail(data.email);
    const emailUser = await this.userRepo.findByEmail(email);
    const user = emailUser ? await this.userRepo.findByIdWithRoles(emailUser.id) : null;

    if (!user) {
      // Constant-time to prevent email enumeration via timing
      await hashPassword('dummy-password-to-waste-time');
      throw AppError.unauthorized('Incorrect email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status === 'disabled') {
      throw AppError.forbidden('Your account has been disabled', ErrorCode.ACCOUNT_DISABLED);
    }

    if (user.status === 'deleted') {
      throw AppError.unauthorized('Incorrect email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    const passwordValid = await verifyPassword(user.passwordHash, data.password);
    if (!passwordValid) {
      throw AppError.unauthorized('Incorrect email or password', ErrorCode.INVALID_CREDENTIALS);
    }


    const roles = user.roles.map(ur => ur.role.name);
    const sessionDuration = data.rememberMe
      ? env.JWT_REFRESH_REMEMBER_ME_EXPIRES_IN
      : env.JWT_REFRESH_EXPIRES_IN;

    const sessionExpiresAt = new Date(Date.now() + ms(sessionDuration));
    const session = await this.sessionRepo.createSession({
      userId:    user.id,
      expiresAt: sessionExpiresAt,
      ...(data.userAgent ? { userAgent: data.userAgent } : {}),
      ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
    });

    const tokens = await this.issueTokenPair({
      userId: user.id,
      email: user.email,
      roles,
      sessionId: session.id,
      refreshExpiresIn: sessionDuration,
    });

    await this.userRepo.updateLastLogin(user.id);

    return {
      ...tokens,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        roles,
      },
    };
  }

  async refreshTokens(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.sessionRepo.findRefreshToken(tokenHash);

    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token', ErrorCode.TOKEN_INVALID);
    }

    if (stored.revoked) {
      // Token reuse detected — revoke entire family
      await this.sessionRepo.revokeFamily(stored.family);
      throw AppError.unauthorized('Token reuse detected. Please log in again.', ErrorCode.TOKEN_REUSE_DETECTED);
    }

    if (stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token expired', ErrorCode.TOKEN_EXPIRED);
    }

    const session = await this.sessionRepo.findActiveSession(stored.sessionId);
    if (!session) {
      throw AppError.unauthorized('Session not found', ErrorCode.SESSION_NOT_FOUND);
    }

    const user = await this.userRepo.findByIdWithRoles(stored.userId);
    if (!user || user.status !== 'active') {
      throw AppError.unauthorized('Account not available', ErrorCode.ACCOUNT_DISABLED);
    }

    const roles = user.roles.map(ur => ur.role.name);

    const newRawToken = generateSecureToken();
    const newTokenHash = hashToken(newRawToken);

    await this.sessionRepo.rotateRefreshToken(stored.id, newTokenHash, stored.expiresAt);
    await this.sessionRepo.touchSession(session.id);

    const accessToken = this.signAccessToken({ userId: user.id, email: user.email, roles, sessionId: session.id });

    return {
      accessToken,
      refreshToken: newRawToken,
      expiresIn: ms(env.JWT_ACCESS_EXPIRES_IN) / 1000,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepo.deleteSession(sessionId);
  }

  async logoutAll(userId: string, currentSessionId: string): Promise<void> {
    await this.sessionRepo.deleteAllUserSessions(userId, currentSessionId);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired verification link', ErrorCode.TOKEN_INVALID);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
  }

  async requestPasswordReset(email: string): Promise<{ token: string; firstName: string } | null> {
    const user = await this.userRepo.findByEmail(normaliseEmail(email));
    // Always succeed — prevent email enumeration
    if (!user || user.status === 'deleted') return null;

    const token = generateSecureToken();
    const tokenHash = hashToken(token);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return { token, firstName: user.firstName };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset link', ErrorCode.TOKEN_INVALID);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revoke all sessions on password reset
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private signAccessToken(payload: {
    userId: string;
    email: string;
    roles: RoleName[];
    sessionId: string;
    impersonatedBy?: string;
  }): string {
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        roles: payload.roles,
        sessionId: payload.sessionId,
        ...(payload.impersonatedBy ? { impersonatedBy: payload.impersonatedBy } : {}),
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    );
  }

  private async issueTokenPair(params: {
    userId: string;
    email: string;
    roles: RoleName[];
    sessionId: string;
    refreshExpiresIn: string;
    impersonatedBy?: string;
  }): Promise<TokenPair> {
    const rawRefreshToken = generateSecureToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const family = uuidv4();

    await this.sessionRepo.createRefreshToken({
      sessionId: params.sessionId,
      userId: params.userId,
      tokenHash: refreshTokenHash,
      family,
      expiresAt: new Date(Date.now() + ms(params.refreshExpiresIn)),
    });

    const accessToken = this.signAccessToken({
      userId:    params.userId,
      email:     params.email,
      roles:     params.roles,
      sessionId: params.sessionId,
      ...(params.impersonatedBy ? { impersonatedBy: params.impersonatedBy } : {}),
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ms(env.JWT_ACCESS_EXPIRES_IN) / 1000,
    };
  }

}
