import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { sendSuccess } from '../../../utils/response';
import { hashPassword, verifyPassword } from '../../../utils/crypto';
import { UpdateProfileInput, ChangePasswordInput, UpdateSettingsInput } from './users.validation';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user!.id, deletedAt: null },
      include: { userLevel: true },
    });

    if (!user) throw AppError.notFound('User not found');

    sendSuccess(res, {
      id:        user.id,
      email:     user.email,
      username:  user.username,
      firstName: user.firstName,
      lastName:  user.lastName,
      avatarUrl: user.avatarUrl,
      bio:       user.bio,
      birthday:  user.birthday ? user.birthday.toISOString().split('T')[0] : null,
      timezone:  user.timezone,
      theme:     user.theme,
      level:     user.userLevel?.level ?? 1,
      totalXp:   Number(user.userLevel?.totalXp ?? 0),
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as UpdateProfileInput;

    if (body.username) {
      const existing = await container.userRepository.findByUsername(body.username);
      if (existing && existing.id !== req.user!.id) {
        throw AppError.conflict('Username is already taken');
      }
    }

    const updated = await container.userRepository.update(req.user!.id, {
      ...(body.firstName  !== undefined && { firstName: body.firstName }),
      ...(body.lastName   !== undefined && { lastName: body.lastName }),
      ...(body.username   !== undefined && { username: body.username }),
      ...(body.bio        !== undefined && { bio: body.bio }),
      ...(body.birthday   !== undefined && { birthday: new Date(body.birthday) }),
      ...(body.timezone   !== undefined && { timezone: body.timezone }),
      ...(body.theme      !== undefined && { theme: body.theme }),
    });

    sendSuccess(res, {
      id:        updated.id,
      email:     updated.email,
      username:  updated.username,
      firstName: updated.firstName,
      lastName:  updated.lastName,
      avatarUrl: updated.avatarUrl,
      bio:       updated.bio,
      timezone:  updated.timezone,
      theme:     updated.theme,
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const user = await prisma.user.findFirst({ where: { id: req.user!.id, deletedAt: null } });
    if (!user) throw AppError.notFound('User not found');

    const valid = await verifyPassword(user.passwordHash, currentPassword);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const newHash = await hashPassword(newPassword);
    await container.userRepository.update(req.user!.id, { passwordHash: newHash });

    // Revoke all other sessions on password change
    await prisma.session.deleteMany({
      where: { userId: req.user!.id, id: { not: req.user!.sessionId } },
    });

    sendSuccess(res, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user!.id } });
    sendSuccess(res, settings ?? {});
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as UpdateSettingsInput;

    // Strip undefined values so Prisma's exactOptionalPropertyTypes is satisfied
    const defined = Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined),
    );

    const settings = await prisma.userSettings.upsert({
      where:  { userId: req.user!.id },
      create: { userId: req.user!.id, ...defined },
      update: defined,
    });

    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id },
      orderBy: { lastActive: 'desc' },
    });

    sendSuccess(res, sessions.map(s => ({
      id:          s.id,
      deviceName:  s.deviceName,
      userAgent:   s.userAgent,
      ipAddress:   s.ipAddress,
      lastActive:  s.lastActive.toISOString(),
      isCurrent:   s.id === req.user!.sessionId,
    })));
  } catch (err) {
    next(err);
  }
}

export async function terminateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const session = await prisma.session.findFirst({ where: { id, userId: req.user!.id } });
    if (!session) throw AppError.notFound('Session not found');
    if (session.id === req.user!.sessionId) throw AppError.badRequest('Cannot terminate current session');

    await prisma.session.delete({ where: { id } });

    sendSuccess(res, { message: 'Session terminated' });
  } catch (err) {
    next(err);
  }
}
