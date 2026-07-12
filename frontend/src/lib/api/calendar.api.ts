import { apiGet } from './client';
import type { CalendarDay } from '@shared/types/api.types';

export const calendarApi = {
  getDays(from: string, to: string): Promise<CalendarDay[]> {
    return apiGet('/calendar/days', { from, to });
  },
};
