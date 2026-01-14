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

export const createPlanSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
    description: z.string().max(1000, 'Description must be 1000 characters or less').nullable().optional(),
    start_date: dateSchema,
    end_date: dateSchema,
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional().default('DRAFT'),
  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
      message: 'end_date must be greater than or equal to start_date',
      path: ['end_date'],
    },
  );

export const updatePlanSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less').optional(),
    description: z.string().max(1000, 'Description must be 1000 characters or less').nullable().optional(),
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
  })
  .refine(
    (data) => {
      // Only validate if both dates are provided
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'end_date must be greater than or equal to start_date',
      path: ['end_date'],
    },
  );

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
