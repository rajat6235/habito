import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { validate }     from '../../../middleware/validate.middleware';
import { calendarDaysQuerySchema } from './calendar.validation';
import { getCalendarDays }         from './calendar.controller';

export const calendarRouter = Router();

calendarRouter.get(
  '/days',
  authenticate,
  validate(calendarDaysQuerySchema, 'query'),
  getCalendarDays,
);
