import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  listGoalsQuerySchema,
  createGoalSchema,
  updateGoalSchema,
  updateGoalProgressSchema,
  createMilestoneSchema,
} from './goals.validation';
import {
  listGoals,
  createGoal,
  getGoal,
  updateGoal,
  updateProgress,
  deleteGoal,
  addMilestone,
  completeMilestone,
  deleteMilestone,
} from './goals.controller';

export const goalsRouter = Router();

// Goal CRUD
goalsRouter.get(
  '/',
  authenticate,
  validate(listGoalsQuerySchema, 'query'),
  listGoals,
);

goalsRouter.post(
  '/',
  authenticate,
  validate(createGoalSchema),
  createGoal,
);

goalsRouter.get(
  '/:id',
  authenticate,
  getGoal,
);

goalsRouter.patch(
  '/:id',
  authenticate,
  validate(updateGoalSchema),
  updateGoal,
);

goalsRouter.patch(
  '/:id/progress',
  authenticate,
  validate(updateGoalProgressSchema),
  updateProgress,
);

goalsRouter.delete(
  '/:id',
  authenticate,
  deleteGoal,
);

// Milestone sub-routes
goalsRouter.post(
  '/:id/milestones',
  authenticate,
  validate(createMilestoneSchema),
  addMilestone,
);

goalsRouter.post(
  '/:id/milestones/:milestoneId/complete',
  authenticate,
  completeMilestone,
);

goalsRouter.delete(
  '/:id/milestones/:milestoneId',
  authenticate,
  deleteMilestone,
);
