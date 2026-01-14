import { NextRequest } from 'next/server';
import { createWorkoutSchema } from '@/lib/validators';
import { WorkoutService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const workoutService = new WorkoutService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId } = params;

  try {
    logger.info(`GET /api/plans/${planId}/workouts`);
    const workouts = await workoutService.listByPlan(planId);
    logger.info({ message: 'Workouts listed', plan_id: planId, count: workouts.length });
    return successResponse(workouts, 200, requestId);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({ message: error.message, error_code: error.code });
      return errorResponse(error.code, error.message, error.statusCode, error.details, requestId);
    }
    logger.error({ message: 'Unexpected error', error: String(error) });
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500, null, requestId);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId } = params;

  try {
    logger.info(`POST /api/plans/${planId}/workouts`);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = createWorkoutSchema.parse(body);

    // Create workout
    const workout = await workoutService.createWorkout(planId, validated);

    logger.info({ message: 'Workout created successfully', workout_id: workout.id, plan_id: planId });
    return successResponse(workout, 201, requestId);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({ message: error.message, error_code: error.code });
      return errorResponse(error.code, error.message, error.statusCode, error.details, requestId);
    }

    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const details = zodError.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [];
      logger.warn({ message: 'Validation error', details });
      return errorResponse('VALIDATION_ERROR', 'Invalid request data', 400, details, requestId);
    }

    logger.error({ message: 'Unexpected error', error: String(error) });
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500, null, requestId);
  }
}
