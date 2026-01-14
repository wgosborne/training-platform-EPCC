import { NextRequest } from 'next/server';
import { updateRunSchema } from '@/lib/validators';
import { RunService } from '@/lib/services';
import { AppError } from '@/lib/utils/errors';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { generateRequestId } from '@/lib/utils/request-id';
import { createRequestLogger } from '@/lib/utils/logger';

const runService = new RunService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; runId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, runId } = params;

  try {
    logger.info(`GET /api/plans/${planId}/runs/${runId}`);
    const run = await runService.getRun(planId, runId);
    logger.info({ message: 'Run retrieved', run_id: runId, plan_id: planId });
    return successResponse(run, 200, requestId);
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
  { params }: { params: { id: string; runId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, runId } = params;

  try {
    logger.info(`PATCH /api/plans/${planId}/runs/${runId}`);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = updateRunSchema.parse(body);

    // Update run
    const run = await runService.updateRun(planId, runId, validated);

    logger.info({ message: 'Run updated successfully', run_id: runId, plan_id: planId });
    return successResponse(run, 200, requestId);
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
  { params }: { params: { id: string; runId: string } },
) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId);
  const { id: planId, runId } = params;

  try {
    logger.info(`DELETE /api/plans/${planId}/runs/${runId}`);
    await runService.deleteRun(planId, runId);
    logger.info({ message: 'Run deleted successfully', run_id: runId, plan_id: planId });
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
