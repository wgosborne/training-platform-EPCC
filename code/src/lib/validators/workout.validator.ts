import { z } from 'zod';

// ISO date format: YYYY-MM-DD
const dateSchema = z
  .string()
  .refine(
    (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
    'Date must be in YYYY-MM-DD format',
  )
  .refine(
    (date) => !isNaN(new Date(date).getTime()),
    'Date must be a valid date',
  );

export const createWorkoutSchema = z.object({
  scheduled_date: dateSchema.nullable().optional(),
  distance: z
    .number()
    .min(0.1, 'Distance must be at least 0.1 miles')
    .max(100, 'Distance must be 100 miles or less'),
  target_pace: z
    .number()
    .int('Target pace must be an integer')
    .min(180, 'Target pace must be at least 180 seconds/mile (3:00/mile)')
    .max(3000, 'Target pace must be 3000 seconds/mile or less (50:00/mile)'),
  workout_type: z.enum(['EASY', 'TEMPO', 'LONG', 'SPEED', 'RECOVERY', 'CROSS_TRAINING', 'REST']),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
});

export const updateWorkoutSchema = z.object({
  scheduled_date: dateSchema.nullable().optional(),
  distance: z
    .number()
    .min(0.1, 'Distance must be at least 0.1 miles')
    .max(100, 'Distance must be 100 miles or less')
    .optional(),
  target_pace: z
    .number()
    .int('Target pace must be an integer')
    .min(180, 'Target pace must be at least 180 seconds/mile (3:00/mile)')
    .max(3000, 'Target pace must be 3000 seconds/mile or less (50:00/mile)')
    .optional(),
  workout_type: z
    .enum(['EASY', 'TEMPO', 'LONG', 'SPEED', 'RECOVERY', 'CROSS_TRAINING', 'REST'])
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
