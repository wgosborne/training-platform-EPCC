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

export const createRunSchema = z.object({
  workout_id: z.string().uuid('Invalid workout ID format').nullable().optional(),
  actual_date: dateSchema,
  distance: z
    .number()
    .min(0.1, 'Distance must be at least 0.1 miles')
    .max(100, 'Distance must be 100 miles or less'),
  actual_pace: z
    .number()
    .int('Actual pace must be an integer')
    .min(180, 'Actual pace must be at least 180 seconds/mile (3:00/mile)')
    .max(3000, 'Actual pace must be 3000 seconds/mile or less (50:00/mile)'),
  source: z.enum(['MANUAL', 'STRAVA']).optional().default('MANUAL'),
});

export const updateRunSchema = z.object({
  workout_id: z.string().uuid('Invalid workout ID format').nullable().optional(),
  actual_date: dateSchema.optional(),
  distance: z
    .number()
    .min(0.1, 'Distance must be at least 0.1 miles')
    .max(100, 'Distance must be 100 miles or less')
    .optional(),
  actual_pace: z
    .number()
    .int('Actual pace must be an integer')
    .min(180, 'Actual pace must be at least 180 seconds/mile (3:00/mile)')
    .max(3000, 'Actual pace must be 3000 seconds/mile or less (50:00/mile)')
    .optional(),
  source: z.enum(['MANUAL', 'STRAVA']).optional(),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type UpdateRunInput = z.infer<typeof updateRunSchema>;
