export class ValidationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
  }
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = 401;
    this.code = 'AUTH_ERROR';
  }
} 