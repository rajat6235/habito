import { Router } from 'express';
import { ZodSchema } from 'zod';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  listJournalQuerySchema,
  ListJournalQuery,
} from './journal.validation';
import {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  getEntryByDate,
} from './journal.controller';

export const journalRouter = Router();

// Coercing schema has Input ≠ Output; cast to satisfy validate's generic
const listSchema = listJournalQuerySchema as unknown as ZodSchema<ListJournalQuery>;

// ── Static route FIRST — must precede /:id ───────────────────────────────────
journalRouter.get('/date/:date', authenticate, getEntryByDate);

// ── Collection ────────────────────────────────────────────────────────────────
journalRouter.get('/',  authenticate, validate(listSchema, 'query'),     listEntries);
journalRouter.post('/', authenticate, validate(createJournalEntrySchema), createEntry);

// ── Resource ──────────────────────────────────────────────────────────────────
journalRouter.get('/:id',    authenticate,                                  getEntry);
journalRouter.patch('/:id',  authenticate, validate(updateJournalEntrySchema), updateEntry);
journalRouter.delete('/:id', authenticate,                                  deleteEntry);
