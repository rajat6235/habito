import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import {
  plannerDateParamSchema,
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
  carryOverSchema,
} from './planner.validation';
import {
  getDayPlan,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  carryOver,
} from './planner.controller';

export const plannerRouter = Router();

// Day plan
plannerRouter.get(
  '/:date',
  authenticate,
  validate(plannerDateParamSchema, 'params'),
  getDayPlan,
);

// Task CRUD — static routes before dynamic /:id
plannerRouter.patch(
  '/tasks/reorder',
  authenticate,
  validate(reorderTasksSchema),
  reorderTasks,
);

plannerRouter.post(
  '/tasks/carry-over',
  authenticate,
  validate(carryOverSchema),
  carryOver,
);

plannerRouter.post(
  '/tasks',
  authenticate,
  validate(createTaskSchema),
  createTask,
);

plannerRouter.patch(
  '/tasks/:id',
  authenticate,
  validate(updateTaskSchema),
  updateTask,
);

plannerRouter.delete(
  '/tasks/:id',
  authenticate,
  deleteTask,
);
