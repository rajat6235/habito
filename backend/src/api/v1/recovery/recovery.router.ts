import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  createRecoveryGoalSchema,
  updateRecoveryGoalSchema,
  logRelapseSchema,
} from './recovery.validation';
import {
  listGoals,
  createGoal,
  getGoal,
  updateGoal,
  deleteGoal,
  pauseGoal,
  resumeGoal,
  logRelapse,
  getSobrietyClock,
  getRelapseHistory,
} from './recovery.controller';

export const recoveryRouter = Router();

// ── Collection ────────────────────────────────────────────────────────────────
recoveryRouter.get('/',  authenticate, listGoals);
recoveryRouter.post('/', authenticate, validate(createRecoveryGoalSchema), createGoal);

// ── Resource ──────────────────────────────────────────────────────────────────
recoveryRouter.get('/:id',           authenticate,                                  getGoal);
recoveryRouter.patch('/:id',         authenticate, validate(updateRecoveryGoalSchema), updateGoal);
recoveryRouter.delete('/:id',        authenticate,                                  deleteGoal);
recoveryRouter.post('/:id/pause',    authenticate,                                  pauseGoal);
recoveryRouter.post('/:id/resume',   authenticate,                                  resumeGoal);
recoveryRouter.post('/:id/relapse',  authenticate, validate(logRelapseSchema),      logRelapse);
recoveryRouter.get('/:id/clock',     authenticate,                                  getSobrietyClock);
recoveryRouter.get('/:id/relapses',  authenticate,                                  getRelapseHistory);
