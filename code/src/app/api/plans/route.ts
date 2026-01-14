import { NextRequest } from 'next/server';
import { createPlanSchema } from '@/lib/validators';
import { PlanService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const planService = new PlanService();

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);

  try {
    logger.info('GET /api/plans');
    const plans = await planService.listPlans();
    logger.info({ message: 'Plans listed', count: plans.length });
    return successResponse(plans, 200, requestId);
  } catch (error) {
    logger.error({ message: 'Error listing plans', error: String(error) });
    return errorResponse('INTERNAL_ERROR', 'Failed to list plans', 500, null, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);

  try {
    logger.info('POST /api/plans');

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = createPlanSchema.parse(body);

    // Create plan
    const plan = await planService.createPlan(validated);

    logger.info({ message: 'Plan created successfully', plan_id: plan.id });
    return successResponse(plan, 201, requestId);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({
        message: error.message,
        error_code: error.code,
        status: error.statusCode,
      });
      return errorResponse(error.code, error.message, error.statusCode, error.details, requestId);
    }

    // Handle Zod validation errors
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
