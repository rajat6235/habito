import { Request, Response, NextFunction } from 'express';
import { RecoveryStatus, RecoveryPreset } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { sendSuccess, sendCreated, sendPaginated } from '../../../utils/response';
import {
  CreateRecoveryGoalInput,
  UpdateRecoveryGoalInput,
  LogRelapseInput,
} from './recovery.validation';

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.query has an index signature — use bracket notation
    const status = req.query['status'] as RecoveryStatus | undefined;

    const goals = await prisma.recoveryGoal.findMany({
      where: {
        userId:    req.user!.id,
        deletedAt: null,
        ...(status !== undefined ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, goals);
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateRecoveryGoalInput;

    const goal = await prisma.recoveryGoal.create({
      data: {
        userId:    req.user!.id,
        name:      body.name,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        status:    RecoveryStatus.active,
        // Optional fields — only include when defined
        ...(body.presetType    !== undefined ? { presetType:    body.presetType as RecoveryPreset } : {}),
        ...(body.icon          !== undefined ? { icon:          body.icon }          : {}),
        ...(body.color         !== undefined ? { color:         body.color }         : {}),
        ...(body.personalWhy   !== undefined ? { personalWhy:   body.personalWhy }   : {}),
        ...(body.emergencyPlan !== undefined ? { emergencyPlan: body.emergencyPlan } : {}),
      },
    });

    sendCreated(res, goal);
  } catch (err) {
    next(err);
  }
}

export async function getGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');

    sendSuccess(res, goal);
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as UpdateRecoveryGoalInput;

    const existing = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Recovery goal');

    const updated = await prisma.recoveryGoal.update({
      where: { id },
      data: {
        ...(body.name          !== undefined ? { name:          body.name }                               : {}),
        ...(body.presetType    !== undefined ? { presetType:    body.presetType as RecoveryPreset }       : {}),
        ...(body.icon          !== undefined ? { icon:          body.icon }                               : {}),
        ...(body.color         !== undefined ? { color:         body.color }                              : {}),
        ...(body.personalWhy   !== undefined ? { personalWhy:   body.personalWhy }                        : {}),
        ...(body.emergencyPlan !== undefined ? { emergencyPlan: body.emergencyPlan }                      : {}),
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Recovery goal');

    await prisma.recoveryGoal.update({
      where: { id },
      data:  { deletedAt: new Date() },
    });

    sendSuccess(res, { message: 'Recovery goal deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function pauseGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');
    if (goal.status !== RecoveryStatus.active) {
      throw AppError.badRequest('Only active goals can be paused');
    }

    const updated = await prisma.recoveryGoal.update({
      where: { id },
      data:  { status: RecoveryStatus.paused },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function resumeGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');
    if (goal.status !== RecoveryStatus.paused) {
      throw AppError.badRequest('Only paused goals can be resumed');
    }

    const updated = await prisma.recoveryGoal.update({
      where: { id },
      data:  { status: RecoveryStatus.active },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ── Relapse ───────────────────────────────────────────────────────────────────

export async function logRelapse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as LogRelapseInput;

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');

    const streakBroken = goal.currentStreakDays;
    const relapsedAt   = body.relapsedAt ? new Date(body.relapsedAt) : new Date();

    const [relapseLog] = await prisma.$transaction([
      prisma.relapseLog.create({
        data: {
          recoveryGoalId: id,
          userId:         req.user!.id,
          relapsedAt,
          triggers:       body.triggers,
          streakBroken,
          // Optional fields — only include when defined
          ...(body.moodBefore  !== undefined ? { moodBefore:  body.moodBefore  } : {}),
          ...(body.location    !== undefined ? { location:    body.location    } : {}),
          ...(body.notes       !== undefined ? { notes:       body.notes       } : {}),
          ...(body.planForNext !== undefined ? { planForNext: body.planForNext } : {}),
        },
      }),
      prisma.recoveryGoal.update({
        where: { id },
        data: {
          currentStreakDays: 0,
          totalRelapses:     { increment: 1 },
        },
      }),
    ]);

    sendCreated(res, relapseLog);
  } catch (err) {
    next(err);
  }
}

// ── Sobriety Clock ────────────────────────────────────────────────────────────

export async function getSobrietyClock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');

    const latestRelapse = await prisma.relapseLog.findFirst({
      where:   { recoveryGoalId: id },
      orderBy: { relapsedAt: 'desc' },
    });

    const baseDate     = latestRelapse ? latestRelapse.relapsedAt : goal.startDate;
    const now          = new Date();
    const diffMs       = Math.max(0, now.getTime() - baseDate.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const days         = Math.floor(totalSeconds / 86400);
    const hours        = Math.floor((totalSeconds % 86400) / 3600);
    const minutes      = Math.floor((totalSeconds % 3600) / 60);
    const seconds      = totalSeconds % 60;

    sendSuccess(res, {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      since:         baseDate.toISOString(),
      lastRelapseAt: latestRelapse?.relapsedAt.toISOString() ?? null,
      totalRelapses: goal.totalRelapses,
      longestStreak: goal.longestStreakDays,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRelapseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id }  = req.params as { id: string };
    // req.query has an index signature — use bracket notation
    const rawLimit  = req.query['limit'];
    const cursor    = req.query['cursor'] as string | undefined;
    const limit     = Math.min(Number(rawLimit ?? 20), 100);

    const goal = await prisma.recoveryGoal.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!goal) throw AppError.notFound('Recovery goal');

    const relapses = await prisma.relapseLog.findMany({
      where:   { recoveryGoalId: id, userId: req.user!.id },
      orderBy: { relapsedAt: 'desc' },
      take:    limit + 1,
      ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = relapses.length > limit;
    const data        = hasNextPage ? relapses.slice(0, limit) : relapses;
    const nextCursor  = hasNextPage ? data.at(-1)!.id : null;

    sendPaginated(res, data, { hasNextPage, nextCursor });
  } catch (err) {
    next(err);
  }
}
