import { NextRequest } from 'next/server';
import { updatePlanSchema } from '@/lib/validators';
import { PlanService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const planService = new PlanService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id } = await params;

  try {
    logger.info(`GET /api/plans/${id}`);
    const plan = await planService.getPlan(id);
    logger.info({ message: 'Plan retrieved', plan_id: id });
    return successResponse(plan, 200, requestId);
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
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id } = await params;

  try {
    logger.info(`PATCH /api/plans/${id}`);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = updatePlanSchema.parse(body);

    // Update plan
    const plan = await planService.updatePlan(id, validated);

    logger.info({ message: 'Plan updated successfully', plan_id: id });
    return successResponse(plan, 200, requestId);
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id } = await params;

  try {
    logger.info(`DELETE /api/plans/${id}`);
    await planService.deletePlan(id);
    logger.info({ message: 'Plan deleted successfully', plan_id: id });
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
