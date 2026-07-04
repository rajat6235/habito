import { apiGet, apiPost, apiPatch, apiDelete, PaginatedResponse } from './client';

export interface JournalEntry {
  id:           string;
  entryDate:    string;
  entryType:    'morning' | 'evening' | 'free_write';
  moodMorning:  number | null;
  energyLevel:  number | null;
  sleepQuality: number | null;
  sleepHours:   number | null;
  gratitude:    string[];
  intention:    string | null;
  wordOfDay:    string | null;
  moodEvening:  number | null;
  dayRating:    number | null;
  wins:         string[];
  lessons:      string | null;
  wouldDoDiff:  string | null;
  tomorrowPrio: string | null;
  stressLevel:  number | null;
  content:      string | null;
  tags:         string[];
  isDraft:      boolean;
  createdAt:    string;
}

export interface CreateJournalEntryPayload {
  entryDate:    string;
  entryType:    'morning' | 'evening' | 'free_write';
  moodMorning?: number;
  energyLevel?: number;
  sleepQuality?: number;
  sleepHours?:  number;
  gratitude?:   string[];
  intention?:   string;
  wordOfDay?:   string;
  moodEvening?: number;
  dayRating?:   number;
  wins?:        string[];
  lessons?:     string;
  wouldDoDiff?: string;
  tomorrowPrio?: string;
  stressLevel?: number;
  content?:     string;
  tags?:        string[];
  isDraft?:     boolean;
}

export const journalApi = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<JournalEntry>> {
    return apiGet('/journal', params) as Promise<PaginatedResponse<JournalEntry>>;
  },

  getByDate(date: string): Promise<JournalEntry[]> {
    return apiGet(`/journal/date/${date}`);
  },

  create(payload: CreateJournalEntryPayload): Promise<JournalEntry> {
    return apiPost('/journal', payload);
  },

  update(id: string, payload: Partial<CreateJournalEntryPayload>): Promise<JournalEntry> {
    return apiPatch(`/journal/${id}`, payload);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/journal/${id}`);
  },
};
