import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AppError } from '../../../errors/AppError';
import { ErrorCode } from '../../../errors/errorCodes';
import { sendSuccess, sendCreated } from '../../../utils/response';
import {
  ListUsersQuery,
  UpdateUserAdminInput,
  ImpersonateInput,
  UpdateFeatureFlagInput,
  ListAuditLogsQuery,
} from './admin.validation';

// ── Users ──────────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListUsersQuery;
    const { search, status, role, page, limit, sort, order } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(status && { status }),
      ...(role && {
        roles: {
          some: { role: { name: role } },
        },
      }),
      ...(search && {
        OR: [
          { email:     { contains: search, mode: 'insensitive' } },
          { username:  { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        include: {
          roles: { include: { role: true } },
          userLevel: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, users, 200, {
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles:     { include: { role: true } },
        userLevel: true,
      },
    });

    if (!user) throw AppError.notFound('User', ErrorCode.USER_NOT_FOUND);

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getUserOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles:     { include: { role: true } },
        userLevel: true,
      },
    });

    if (!user) throw AppError.notFound('User', ErrorCode.USER_NOT_FOUND);

    const [
      habitCount,
      activeHabitCount,
      journalCount,
      goalCount,
      taskCount,
      recentActivity,
    ] = await Promise.all([
      prisma.habit.count({ where: { userId: id, deletedAt: null } }),
      prisma.habit.count({ where: { userId: id, deletedAt: null, isArchived: false } }),
      prisma.journalEntry.count({ where: { userId: id } }),
      prisma.goal.count({ where: { userId: id, deletedAt: null } }),
      prisma.plannerTask.count({ where: { userId: id } }),
      prisma.auditLog.findMany({
        where: { actorId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    sendSuccess(res, {
      user,
      stats: {
        habitCount,
        activeHabitCount,
        journalCount,
        goalCount,
        taskCount,
        totalXp: Number(user.userLevel?.totalXp ?? 0),
        level:   user.userLevel?.level ?? 1,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where: { userId: id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, icon: true, color: true,
          frequencyType: true, priority: true, isArchived: true,
          currentStreak: true, longestStreak: true, totalCompletions: true,
          successRate: true, createdAt: true,
        },
      }),
      prisma.habit.count({ where: { userId: id, deletedAt: null } }),
    ]);

    sendSuccess(res, habits, 200, {
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserJournals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId: id, deletedAt: null },
        orderBy: { entryDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, entryDate: true, entryType: true,
          moodMorning: true, moodEvening: true, dayRating: true,
          contentPlain: true, tags: true, isDraft: true, createdAt: true,
        },
      }),
      prisma.journalEntry.count({ where: { userId: id, deletedAt: null } }),
    ]);

    sendSuccess(res, entries, 200, {
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where: { userId: id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, category: true, goalType: true,
          progressType: true, currentValue: true, targetValue: true,
          progressPct: true, status: true, priority: true,
          targetDate: true, completedAt: true, createdAt: true,
        },
      }),
      prisma.goal.count({ where: { userId: id, deletedAt: null } }),
    ]);

    sendSuccess(res, goals, 200, {
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'), 10)));

    const [tasks, total] = await Promise.all([
      prisma.plannerTask.findMany({
        where: { userId: id },
        orderBy: { planDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, planDate: true, timeBlock: true,
          priority: true, isCompleted: true, completedAt: true,
          estimatedMin: true, notes: true, createdAt: true,
        },
      }),
      prisma.plannerTask.count({ where: { userId: id } }),
    ]);

    sendSuccess(res, tasks, 200, {
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateUserAdminInput;

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('User', ErrorCode.USER_NOT_FOUND);

    // Update status if provided
    if (body.status !== undefined) {
      await prisma.user.update({
        where: { id },
        data:  { status: body.status },
      });
    }

    // Replace user roles if provided
    if (body.role !== undefined) {
      const roleRecord = await prisma.role.findUnique({ where: { name: body.role } });
      if (!roleRecord) throw AppError.badRequest(`Role '${body.role}' not found`);

      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId: id } }),
        prisma.userRole.create({
          data: {
            userId:     id,
            roleId:     roleRecord.id,
            assignedBy: req.user!.id,
          },
        }),
      ]);
    }

    const updated = await prisma.user.findFirst({
      where: { id },
      include: {
        roles:     { include: { role: true } },
        userLevel: true,
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    if (!existing) throw AppError.notFound('User', ErrorCode.USER_NOT_FOUND);

    const isSuperAdmin = existing.roles.some(ur => ur.role.name === 'super_admin');
    if (isSuperAdmin) {
      throw AppError.forbidden('Cannot delete a super_admin user', ErrorCode.FORBIDDEN);
    }

    await prisma.user.update({
      where: { id },
      data:  { deletedAt: new Date(), status: 'deleted' },
    });

    sendSuccess(res, { message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

export async function impersonateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: targetUserId } = req.params as { id: string };
    const body = req.body as ImpersonateInput;

    if (!env.ADMIN_IMPERSONATION_ENABLED) {
      throw AppError.forbidden('Impersonation is disabled', ErrorCode.IMPERSONATION_DISABLED);
    }

    if (targetUserId === req.user!.id) {
      throw AppError.badRequest('Cannot impersonate yourself');
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    if (!targetUser) throw AppError.notFound('User', ErrorCode.USER_NOT_FOUND);

    const actorRoles   = req.user!.roles;
    const targetRoles  = targetUser.roles.map(ur => ur.role.name);
    const isSuperAdmin = actorRoles.includes('super_admin');
    const targetIsSuperAdmin = targetRoles.includes('super_admin');

    if (targetIsSuperAdmin && !isSuperAdmin) {
      throw AppError.forbidden(
        'Cannot impersonate a super_admin user',
        ErrorCode.INSUFFICIENT_PERMISSIONS,
      );
    }

    const sessionTokenId = uuidv4();

    const session = await prisma.impersonationSession.create({
      data: {
        adminId:        req.user!.id,
        targetUserId,
        reason:         body.reason,
        reasonCategory: body.reasonCategory,
        ipAddress:      req.ip ?? '0.0.0.0',
        userAgent:      req.get('user-agent') ?? null,
        sessionTokenId,
      },
    });

    const accessToken = jwt.sign(
      {
        sub:            targetUser.id,
        email:          targetUser.email,
        roles:          targetRoles,
        sessionId:      'impersonation',
        impersonatedBy: req.user!.id,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: `${env.ADMIN_IMPERSONATION_SESSION_DURATION_MIN}m` },
    );

    sendCreated(res, { accessToken, impersonationId: session.id });
  } catch (err) {
    next(err);
  }
}

export async function endImpersonation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const session = await prisma.impersonationSession.findFirst({
      where: { id, adminId: req.user!.id, endedAt: null },
    });
    if (!session) throw AppError.notFound('Impersonation session', ErrorCode.SESSION_NOT_FOUND);

    const updated = await prisma.impersonationSession.update({
      where: { id },
      data:  { endedAt: new Date() },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ── Audit Logs ─────────────────────────────────────────────────────────────────

export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListAuditLogsQuery;
    const { actorId, entityType, action, from, to, page, limit } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(actorId    && { actorId }),
      ...(entityType && { entityType }),
      ...(action     && { action }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to)   }),
        },
      }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, logs, 200, {
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    next(err);
  }
}

// ── Feature Flags ──────────────────────────────────────────────────────────────

export async function getFeatureFlags(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    sendSuccess(res, flags);
  } catch (err) {
    next(err);
  }
}

export async function updateFeatureFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.params as { key: string };
    const body = req.body as UpdateFeatureFlagInput;

    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw AppError.notFound('Feature flag', ErrorCode.NOT_FOUND);

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...(body.isEnabled  !== undefined && { isEnabled:  body.isEnabled }),
        ...(body.rolloutPct !== undefined && { rolloutPct: body.rolloutPct }),
        ...(body.config     !== undefined && { config:     body.config as Prisma.InputJsonValue }),
        updatedBy: req.user!.id,
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ── Global Settings ────────────────────────────────────────────────────────────

export async function getGlobalSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.globalSetting.findMany({
      orderBy: { key: 'asc' },
    });
    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function updateGlobalSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.params as { key: string };
    const { value } = req.body as { value: unknown };

    const existing = await prisma.globalSetting.findUnique({ where: { key } });
    if (!existing) throw AppError.notFound('Setting', ErrorCode.NOT_FOUND);

    const updated = await prisma.globalSetting.update({
      where: { key },
      data: {
        value:     value as Prisma.InputJsonValue,
        updatedBy: req.user!.id,
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ── System Stats ───────────────────────────────────────────────────────────────

export async function getSystemStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, activeUsers, totalHabits, totalJournalEntries] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'active', deletedAt: null } }),
      prisma.habit.count({ where: { deletedAt: null } }),
      prisma.journalEntry.count(),
    ]);

    sendSuccess(res, { totalUsers, activeUsers, totalHabits, totalJournalEntries });
  } catch (err) {
    next(err);
  }
}
