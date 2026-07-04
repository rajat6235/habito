import { z } from 'zod';

export const createNoteSchema = z.object({
  title:    z.string().max(500).trim().default('Untitled'),
  content:  z.string().max(500_000).optional(),
  noteType: z.enum(['general','gym','workout_plan','meal_plan','meeting','idea','book','shopping','journal']).default('general'),
  folderId: z.string().uuid().optional(),
  isPinned: z.boolean().default(false),
  tagIds:   z.array(z.string().uuid()).max(20).default([]),
});

export const updateNoteSchema = z.object({
  title:      z.string().max(500).trim().optional(),
  content:    z.string().max(500_000).optional(),
  folderId:   z.string().uuid().nullable().optional(),
  isPinned:   z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tagIds:     z.array(z.string().uuid()).max(20).optional(),
});

export const listNotesQuerySchema = z.object({
  folderId:   z.string().uuid().optional(),
  noteType:   z.enum(['general','gym','workout_plan','meal_plan','meeting','idea','book','shopping','journal']).optional(),
  isPinned:   z.enum(['true','false']).transform(v => v === 'true').optional(),
  isFavorite: z.enum(['true','false']).transform(v => v === 'true').optional(),
  isArchived: z.enum(['true','false']).transform(v => v === 'true').optional(),
  tagId:      z.string().uuid().optional(),
  cursor:     z.string().optional(),
  limit:      z.coerce.number().int().min(1).max(50).default(20),
  sort:       z.enum(['updatedAt', 'createdAt', 'title']).default('updatedAt'),
  order:      z.enum(['asc', 'desc']).default('desc'),
});

export const createFolderSchema = z.object({
  name:      z.string().min(1).max(200).trim(),
  parentId:  z.string().uuid().optional(),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon:      z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createTagSchema = z.object({
  name:  z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateNoteInput    = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput    = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery     = z.infer<typeof listNotesQuerySchema>;
export type CreateFolderInput  = z.infer<typeof createFolderSchema>;
export type CreateTagInput     = z.infer<typeof createTagSchema>;
