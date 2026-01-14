import { NextRequest } from 'next/server';
import { updateWorkoutSchema } from '@/lib/validators';
import { WorkoutService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const workoutService = new WorkoutService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; workoutId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, workoutId } = params;

  try {
    logger.info(`GET /api/plans/${planId}/workouts/${workoutId}`);
    const workout = await workoutService.getWorkout(planId, workoutId);
    logger.info({ message: 'Workout retrieved', workout_id: workoutId, plan_id: planId });
    return successResponse(workout, 200, requestId);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({ message: error.message, error_code: error.code });
      return errorResponse(error.code, error.message, error.statusCode, error.details, requestId);
    }
    logger.error({ message: 'Unexpected error', error: String(error) });
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500, null, requestId);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; workoutId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, workoutId } = params;

  try {
    logger.info(`PATCH /api/plans/${planId}/workouts/${workoutId}`);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = updateWorkoutSchema.parse(body);

    // Update workout
    const workout = await workoutService.updateWorkout(planId, workoutId, validated);

    logger.info({ message: 'Workout updated successfully', workout_id: workoutId, plan_id: planId });
    return successResponse(workout, 200, requestId);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; workoutId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, workoutId } = params;

  try {
    logger.info(`DELETE /api/plans/${planId}/workouts/${workoutId}`);
    await workoutService.deleteWorkout(planId, workoutId);
    logger.info({ message: 'Workout deleted successfully', workout_id: workoutId, plan_id: planId });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({ message: error.message, error_code: error.code });
      return errorResponse(error.code, error.message, error.statusCode, error.details, requestId);
    }
    logger.error({ message: 'Unexpected error', error: String(error) });
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 500, null, requestId);
  }
}
