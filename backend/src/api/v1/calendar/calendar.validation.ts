import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const calendarDaysQuerySchema = z
  .object({
    from: z.string().regex(datePattern, 'Must be YYYY-MM-DD'),
    to:   z.string().regex(datePattern, 'Must be YYYY-MM-DD'),
  })
  .refine((d) => d.from <= d.to, { message: 'from must be ≤ to', path: ['from'] });

export type CalendarDaysQuery = z.infer<typeof calendarDaysQuerySchema>;
