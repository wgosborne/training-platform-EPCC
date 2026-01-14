export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details: any = null,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super('CONFLICT', message, 409, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super('INTERNAL_ERROR', message, 500, details);
  }
}
