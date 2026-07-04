import { z } from 'zod';

export const createExerciseSchema = z.object({
  name:             z.string().min(1).max(200).trim(),
  description:      z.string().max(2000).optional(),
  category:         z.enum(['strength','cardio','flexibility','hiit','sports','other']),
  equipment:        z.enum(['barbell','dumbbell','machine','cable','bodyweight','kettlebell','resistance_band','pullup_bar','other','none']).default('none'),
  primaryMuscles:   z.array(z.string().max(50)).max(10).default([]),
  secondaryMuscles: z.array(z.string().max(50)).max(10).default([]),
  instructions:     z.string().max(5000).optional(),
});

export const listExercisesQuerySchema = z.object({
  category:    z.enum(['strength','cardio','flexibility','hiit','sports','other']).optional(),
  equipment:   z.string().optional(),
  muscle:      z.string().optional(),
  search:      z.string().max(100).optional(),
  includeGlobal: z.enum(['true','false']).transform(v => v !== 'false').default('true'),
  cursor:      z.string().optional(),
  limit:       z.coerce.number().int().min(1).max(100).default(20),
});

export const createTemplateSchema = z.object({
  name:                z.string().min(1).max(200).trim(),
  description:         z.string().max(1000).optional(),
  estimatedDurationMin: z.number().int().min(1).optional(),
  category:            z.string().max(100).optional(),
  exercises: z.array(z.object({
    exerciseId:   z.string().uuid(),
    sortOrder:    z.number().int().min(0),
    targetSets:   z.number().int().min(1).max(20).optional(),
    targetReps:   z.string().max(50).optional(),
    targetWeight: z.number().positive().optional(),
    restSeconds:  z.number().int().min(0).max(600).default(90),
    notes:        z.string().max(500).optional(),
  })).min(1).max(30),
});

export const startWorkoutSchema = z.object({
  templateId: z.string().uuid().optional(),
  name:       z.string().max(200).optional(),
});

export const addSessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sortOrder:  z.number().int().min(0),
  notes:      z.string().max(500).optional(),
});

export const logSetSchema = z.object({
  setNumber:       z.number().int().min(1).max(50),
  setType:         z.enum(['normal','warmup','dropset','failure']).default('normal'),
  weightKg:        z.number().min(0).max(9999).optional(),
  reps:            z.number().int().min(0).max(9999).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceMeters:  z.number().min(0).optional(),
  rpe:             z.number().min(1).max(10).optional(),
  isCompleted:     z.boolean().default(true),
  restSecondsTaken: z.number().int().min(0).optional(),
});

export const finishWorkoutSchema = z.object({
  moodBefore:   z.number().int().min(1).max(5).optional(),
  effortRating: z.number().int().min(1).max(5).optional(),
  notes:        z.string().max(2000).optional(),
});

export const createMeasurementSchema = z.object({
  measuredAt: z.string().date(),
  weightKg:   z.number().positive().max(999).optional(),
  bodyFatPct: z.number().min(1).max(99).optional(),
  chestCm:    z.number().positive().optional(),
  waistCm:    z.number().positive().optional(),
  hipsCm:     z.number().positive().optional(),
  bicepCm:    z.number().positive().optional(),
  thighCm:    z.number().positive().optional(),
  notes:      z.string().max(500).optional(),
});

export const workoutHistoryQuerySchema = z.object({
  from:       z.string().date().optional(),
  to:         z.string().date().optional(),
  templateId: z.string().uuid().optional(),
  cursor:     z.string().optional(),
  limit:      z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateExerciseInput      = z.infer<typeof createExerciseSchema>;
export type CreateTemplateInput      = z.infer<typeof createTemplateSchema>;
export type StartWorkoutInput        = z.infer<typeof startWorkoutSchema>;
export type AddSessionExerciseInput  = z.infer<typeof addSessionExerciseSchema>;
export type LogSetInput              = z.infer<typeof logSetSchema>;
export type FinishWorkoutInput       = z.infer<typeof finishWorkoutSchema>;
export type CreateMeasurementInput   = z.infer<typeof createMeasurementSchema>;
