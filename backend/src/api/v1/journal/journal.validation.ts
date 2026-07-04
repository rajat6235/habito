import { z } from 'zod';

const moodField   = z.number().int().min(1).max(10);
const ratingField = z.number().int().min(1).max(5);

export const createJournalEntrySchema = z.object({
  entryDate: z.string().date(),
  entryType: z.enum(['morning', 'evening', 'free_write']),

  // Morning fields
  moodMorning:  moodField.optional(),
  energyLevel:  moodField.optional(),
  sleepQuality: moodField.optional(),
  sleepHours:   z.number().min(0).max(24).optional(),
  gratitude:    z.array(z.string().max(500)).max(10).optional(),
  intention:    z.string().max(1000).optional(),
  wordOfDay:    z.string().max(50).optional(),

  // Evening fields
  moodEvening:  moodField.optional(),
  dayRating:    ratingField.optional(),
  wins:         z.array(z.string().max(500)).max(10).optional(),
  lessons:      z.string().max(2000).optional(),
  wouldDoDiff:  z.string().max(2000).optional(),
  tomorrowPrio: z.string().max(500).optional(),
  stressLevel:  moodField.optional(),

  // Shared
  content:  z.string().max(50000).optional(),
  tags:     z.array(z.string().max(50)).max(20).default([]),
  isDraft:  z.boolean().default(false),
});

export const updateJournalEntrySchema = createJournalEntrySchema
  .omit({ entryDate: true, entryType: true })
  .partial();

export const listJournalQuerySchema = z.object({
  type:   z.enum(['morning', 'evening', 'free_write']).optional(),
  from:   z.string().date().optional(),
  to:     z.string().date().optional(),
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type ListJournalQuery        = z.infer<typeof listJournalQuerySchema>;
