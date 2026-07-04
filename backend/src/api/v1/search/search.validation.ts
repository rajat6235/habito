import { z } from 'zod';

export const searchQuerySchema = z.object({
  q:      z.string().min(1).max(200).trim(),
  types:  z.string()
    .transform(s => s.split(',').filter(Boolean))
    .pipe(z.array(z.enum(['habits','notes','journal','goals','workouts','recovery'])))
    .default('habits,notes,journal,goals,workouts,recovery'),
  limit:  z.coerce.number().int().min(1).max(20).default(5),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
