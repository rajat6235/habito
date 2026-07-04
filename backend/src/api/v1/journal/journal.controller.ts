import { Request, Response, NextFunction } from 'express';
import { JournalEntryType } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../errors/AppError';
import { sendSuccess, sendCreated, sendPaginated } from '../../../utils/response';
import {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  ListJournalQuery,
} from './journal.validation';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a Prisma-safe data object for journal create/upsert.
 * Omits undefined optional fields so exactOptionalPropertyTypes is satisfied.
 */
function buildJournalCreateData(body: CreateJournalEntryInput) {
  return {
    // Required / always-present fields (Zod provides defaults)
    tags:    body.tags,
    isDraft: body.isDraft,
    // Optional fields — only include when defined
    ...(body.moodMorning  !== undefined ? { moodMorning:  body.moodMorning  } : {}),
    ...(body.energyLevel  !== undefined ? { energyLevel:  body.energyLevel  } : {}),
    ...(body.sleepQuality !== undefined ? { sleepQuality: body.sleepQuality } : {}),
    ...(body.sleepHours   !== undefined ? { sleepHours:   body.sleepHours   } : {}),
    ...(body.gratitude    !== undefined ? { gratitude:    body.gratitude    } : {}),
    ...(body.intention    !== undefined ? { intention:    body.intention    } : {}),
    ...(body.wordOfDay    !== undefined ? { wordOfDay:    body.wordOfDay    } : {}),
    ...(body.moodEvening  !== undefined ? { moodEvening:  body.moodEvening  } : {}),
    ...(body.dayRating    !== undefined ? { dayRating:    body.dayRating    } : {}),
    ...(body.wins         !== undefined ? { wins:         body.wins         } : {}),
    ...(body.lessons      !== undefined ? { lessons:      body.lessons      } : {}),
    ...(body.wouldDoDiff  !== undefined ? { wouldDoDiff:  body.wouldDoDiff  } : {}),
    ...(body.tomorrowPrio !== undefined ? { tomorrowPrio: body.tomorrowPrio } : {}),
    ...(body.stressLevel  !== undefined ? { stressLevel:  body.stressLevel  } : {}),
    ...(body.content      !== undefined ? { content:      body.content      } : {}),
  };
}

/**
 * Build a Prisma-safe data object for journal updates (partial).
 */
function buildJournalUpdateData(body: UpdateJournalEntryInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const pairs: [string, unknown][] = [
    ['moodMorning',  body.moodMorning],
    ['energyLevel',  body.energyLevel],
    ['sleepQuality', body.sleepQuality],
    ['sleepHours',   body.sleepHours],
    ['gratitude',    body.gratitude],
    ['intention',    body.intention],
    ['wordOfDay',    body.wordOfDay],
    ['moodEvening',  body.moodEvening],
    ['dayRating',    body.dayRating],
    ['wins',         body.wins],
    ['lessons',      body.lessons],
    ['wouldDoDiff',  body.wouldDoDiff],
    ['tomorrowPrio', body.tomorrowPrio],
    ['stressLevel',  body.stressLevel],
    ['content',      body.content],
    ['tags',         body.tags],
    ['isDraft',      body.isDraft],
  ];
  for (const [key, value] of pairs) {
    if (value !== undefined) data[key] = value;
  }
  return data;
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function listEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListJournalQuery;
    const { type, from, to, cursor, limit } = query;

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId:    req.user!.id,
        deletedAt: null,
        ...(type ? { entryType: type as JournalEntryType } : {}),
        ...((from || to) ? {
          entryDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          },
        } : {}),
      },
      orderBy: { entryDate: 'desc' },
      take:    limit + 1,
      ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = entries.length > limit;
    const data        = hasNextPage ? entries.slice(0, limit) : entries;
    const nextCursor  = hasNextPage ? data.at(-1)!.id : null;

    sendPaginated(res, data, { hasNextPage, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function createEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body      = req.body as CreateJournalEntryInput;
    const entryDate = new Date(body.entryDate);
    const entryType = body.entryType as JournalEntryType;
    const userId    = req.user!.id;

    const shared = buildJournalCreateData(body);

    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_entryDate_entryType: { userId, entryDate, entryType },
      },
      create: {
        userId,
        entryDate,
        entryType,
        deletedAt: null,
        ...shared,
      },
      update: {
        deletedAt: null,   // resurrect if previously soft-deleted
        ...shared,
      },
    });

    sendCreated(res, entry);
  } catch (err) {
    next(err);
  }
}

export async function getEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!entry) throw AppError.notFound('Journal entry');

    sendSuccess(res, entry);
  } catch (err) {
    next(err);
  }
}

export async function updateEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const body   = req.body as UpdateJournalEntryInput;

    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Journal entry');

    const updated = await prisma.journalEntry.update({
      where: { id },
      data:  buildJournalUpdateData(body),
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound('Journal entry');

    await prisma.journalEntry.update({
      where: { id },
      data:  { deletedAt: new Date() },
    });

    sendSuccess(res, { message: 'Journal entry deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getEntryByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.params as { date: string };

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId:    req.user!.id,
        entryDate: new Date(date),
        deletedAt: null,
      },
      orderBy: { entryType: 'asc' },
    });

    sendSuccess(res, entries);
  } catch (err) {
    next(err);
  }
}
