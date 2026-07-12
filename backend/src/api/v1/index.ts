import { Router } from 'express';
import { authRouter }     from './auth/auth.router';
import { usersRouter }    from './users/users.router';
import { habitsRouter }   from './habits/habits.router';
import { journalRouter }  from './journal/journal.router';
import { recoveryRouter } from './recovery/recovery.router';
import { goalsRouter }    from './goals/goals.router';
import { plannerRouter }  from './planner/planner.router';
import { adminRouter }    from './admin/admin.router';
import { calendarRouter } from './calendar/calendar.router';

export const v1Router = Router();

v1Router.use('/auth',     authRouter);
v1Router.use('/users',    usersRouter);
v1Router.use('/habits',   habitsRouter);
v1Router.use('/journal',  journalRouter);
v1Router.use('/recovery', recoveryRouter);
v1Router.use('/goals',    goalsRouter);
v1Router.use('/planner',  plannerRouter);
v1Router.use('/admin',    adminRouter);
v1Router.use('/calendar', calendarRouter);
