import { NextResponse } from 'next/server';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  request_id: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: any;
  };
  timestamp: string;
  request_id: string;
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId: string = '',
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      request_id: requestId,
    },
    { status: statusCode },
  );
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details: any = null,
  requestId: string = '',
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      request_id: requestId,
    },
    { status: statusCode },
  );
}
