import { NextRequest } from 'next/server';
import { createRunSchema } from '@/lib/validators';
import { RunService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const runService = new RunService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId } = await params;

  try {
    logger.info(`GET /api/plans/${planId}/runs`);
    const runs = await runService.listByPlan(planId);
    logger.info({ message: 'Runs listed', plan_id: planId, count: runs.length });
    return successResponse(runs, 200, requestId);
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
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId } = await params;

  try {
    logger.info(`POST /api/plans/${planId}/runs`);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = createRunSchema.parse(body);

    // Create run
    const run = await runService.createRun(planId, validated);

    logger.info({ message: 'Run created successfully', run_id: run.id, plan_id: planId });
    return successResponse(run, 201, requestId);
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
