import { z } from 'zod';

export const createTaskSchema = z.object({
  planDate:     z.string().date(),
  timeBlock:    z.enum(['morning','afternoon','evening','night']),
  title:        z.string().min(1).max(500).trim(),
  notes:        z.string().max(2000).optional(),
  priority:     z.number().int().min(1).max(4).default(2),
  estimatedMin: z.number().int().min(1).max(480).optional(),
  sortOrder:    z.number().int().min(0).default(0),
  goalId:       z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  timeBlock:    z.enum(['morning','afternoon','evening','night']).optional(),
  title:        z.string().min(1).max(500).trim().optional(),
  notes:        z.string().max(2000).optional(),
  priority:     z.number().int().min(1).max(4).optional(),
  estimatedMin: z.number().int().min(1).max(480).optional(),
  actualMin:    z.number().int().min(0).max(480).optional(),
  sortOrder:    z.number().int().min(0).optional(),
  isCompleted:  z.boolean().optional(),
  goalId:       z.string().uuid().nullable().optional(),
});

export const carryOverSchema = z.object({
  fromDate: z.string().date(),
  toDate:   z.string().date(),
  taskIds:  z.array(z.string().uuid()).min(1).max(50),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(z.object({
    id:        z.string().uuid(),
    sortOrder: z.number().int().min(0),
    timeBlock: z.enum(['morning','afternoon','evening','night']).optional(),
  })).min(1).max(100),
});

export const plannerDateParamSchema = z.object({
  date: z.string().date(),
});

export type CreateTaskInput   = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput   = z.infer<typeof updateTaskSchema>;
export type CarryOverInput    = z.infer<typeof carryOverSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
