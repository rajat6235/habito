import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface PlannerTask {
  id:                string;
  title:             string;
  description?:      string;
  isCompleted:       boolean;
  priority:          'low' | 'medium' | 'high';
  timeBlock?:        string;
  estimatedMinutes?: number;
  date:              string;
  order:             number;
}

export interface CreateTaskPayload {
  title:             string;
  date:              string;
  priority?:         'low' | 'medium' | 'high';
  timeBlock?:        string;
  estimatedMinutes?: number;
  description?:      string;
}

export interface UpdateTaskPayload {
  isCompleted?: boolean;
  title?:       string;
  priority?:    'low' | 'medium' | 'high';
  timeBlock?:   string;
  description?: string;
  order?:       number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const PRIORITY_FROM_NUM: Record<number, PlannerTask['priority']> = {
  1: 'low', 2: 'medium', 3: 'high', 4: 'high',
};
const PRIORITY_TO_NUM: Record<string, number> = {
  low: 1, medium: 2, high: 3,
};

function mapTask(raw: Record<string, unknown>): PlannerTask {
  const priority = typeof raw['priority'] === 'number'
    ? (PRIORITY_FROM_NUM[raw['priority'] as number] ?? 'medium')
    : ((raw['priority'] as string) ?? 'medium');
  return {
    id:               raw['id'] as string,
    title:            raw['title'] as string,
    description:      raw['description'] as string | undefined,
    isCompleted:      Boolean(raw['isCompleted'] ?? raw['is_completed']),
    priority:         priority as PlannerTask['priority'],
    timeBlock:        (raw['timeBlock'] as string | undefined) ?? undefined,
    estimatedMinutes: (raw['estimatedMin'] as number | undefined) ?? (raw['estimatedMinutes'] as number | undefined),
    date:             ((raw['planDate'] as string) ?? (raw['date'] as string) ?? '').slice(0, 10),
    order:            (raw['sortOrder'] as number) ?? (raw['order'] as number) ?? 0,
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

export const plannerApi = {
  async listByDate(date: string): Promise<PlannerTask[]> {
    const raw = await apiGet<Record<string, unknown[]>>(`/planner/${date}`);
    const blocks = ['morning', 'afternoon', 'evening', 'night'] as const;
    const all: Record<string, unknown>[] = [];
    for (const block of blocks) {
      const tasks = raw[block];
      if (Array.isArray(tasks)) all.push(...(tasks as Record<string, unknown>[]));
    }
    return all.map(mapTask);
  },

  async create(payload: CreateTaskPayload): Promise<PlannerTask> {
    const backendPayload = {
      planDate:     payload.date,
      title:        payload.title,
      description:  payload.description,
      priority:     PRIORITY_TO_NUM[payload.priority ?? 'medium'] ?? 2,
      timeBlock:    payload.timeBlock ?? 'morning',
      sortOrder:    0,
      estimatedMin: payload.estimatedMinutes,
    };
    const raw = await apiPost<Record<string, unknown>>('/planner/tasks', backendPayload);
    return mapTask(raw);
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<PlannerTask> {
    const backendPayload: Record<string, unknown> = {};
    if (payload.isCompleted !== undefined) backendPayload['isCompleted'] = payload.isCompleted;
    if (payload.title       !== undefined) backendPayload['title']       = payload.title;
    if (payload.priority    !== undefined) backendPayload['priority']    = PRIORITY_TO_NUM[payload.priority] ?? 2;
    if (payload.timeBlock   !== undefined) backendPayload['timeBlock']   = payload.timeBlock;
    if (payload.description !== undefined) backendPayload['description'] = payload.description;
    if (payload.order       !== undefined) backendPayload['sortOrder']   = payload.order;
    const raw = await apiPatch<Record<string, unknown>>(`/planner/tasks/${id}`, backendPayload);
    return mapTask(raw);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/planner/tasks/${id}`);
  },

  async carryOver(fromDate: string, toDate: string): Promise<PlannerTask[]> {
    const raw = await apiPost<unknown>('/planner/tasks/carry-over', { fromDate, toDate });
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((t) => mapTask(t as Record<string, unknown>));
  },
};
