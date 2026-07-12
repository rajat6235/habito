import { Router } from 'express';
import { ZodSchema } from 'zod';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  createHabitSchema,
  updateHabitSchema,
  logHabitSchema,
  updateLogSchema,
  listHabitsQuerySchema,
  habitLogsQuerySchema,
  createCategorySchema,
  ListHabitsQuery,
  HabitLogsQuery,
} from './habits.validation';
import {
  listCategories,
  createCategory,
  listHabits,
  createHabit,
  getHabit,
  updateHabit,
  deleteHabit,
  archiveHabit,
  logHabit,
  updateLog,
  deleteLog,
  getHabitLogs,
  getHabitStats,
  getTodayHabits,
} from './habits.controller';

export const habitsRouter = Router();

const listHabitsSchema  = listHabitsQuerySchema  as unknown as ZodSchema<ListHabitsQuery>;
const habitLogsSchema   = habitLogsQuerySchema   as unknown as ZodSchema<HabitLogsQuery>;

// ── Static routes FIRST ────────────────────────────────────────────────────────
habitsRouter.get('/today',       authenticate, getTodayHabits);
habitsRouter.get('/categories',  authenticate, listCategories);
habitsRouter.post('/categories', authenticate, validate(createCategorySchema), createCategory);

// ── Collection ────────────────────────────────────────────────────────────────
habitsRouter.get('/',  authenticate, validate(listHabitsSchema, 'query'), listHabits);
habitsRouter.post('/', authenticate, validate(createHabitSchema),         createHabit);

// ── Resource ──────────────────────────────────────────────────────────────────
habitsRouter.get('/:id',              authenticate,                               getHabit);
habitsRouter.patch('/:id',            authenticate, validate(updateHabitSchema),  updateHabit);
habitsRouter.delete('/:id',           authenticate,                               deleteHabit);
habitsRouter.post('/:id/archive',     authenticate,                               archiveHabit);
habitsRouter.get('/:id/stats',        authenticate,                               getHabitStats);

// ── Logs ──────────────────────────────────────────────────────────────────────
habitsRouter.post('/:id/log',          authenticate, validate(logHabitSchema),    logHabit);
habitsRouter.patch('/:id/log/:date',   authenticate, validate(updateLogSchema),   updateLog);
habitsRouter.delete('/:id/log/:date',  authenticate,                              deleteLog);
habitsRouter.get('/:id/logs',          authenticate, validate(habitLogsSchema, 'query'), getHabitLogs);
