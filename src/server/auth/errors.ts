export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'CONFLICT';

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication is required') {
    super('UNAUTHENTICATED', message);
    this.name = 'UnauthenticatedError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found') {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super('VALIDATION', message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}
