import { HttpException, HttpStatus, Logger } from '@nestjs/common';

/**
 * Common error codes used across services
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Chat errors
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  NOT_CHAT_MEMBER = 'NOT_CHAT_MEMBER',
  
  // Translation errors
  TRANSLATION_ERROR = 'TRANSLATION_ERROR',
  LANGUAGE_NOT_SUPPORTED = 'LANGUAGE_NOT_SUPPORTED',
  
  // Service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Other errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    public readonly httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    details?: any,
  ) {
    super(message, code, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * NotFound errors
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    code: ErrorCode = ErrorCode.RECORD_NOT_FOUND,
    details?: any,
  ) {
    super(message, code, HttpStatus.NOT_FOUND, details);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    details?: any,
  ) {
    super(message, code, HttpStatus.BAD_REQUEST, details);
  }
}

/**
 * Format error for consistent response
 */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: ErrorCode;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Format error for HTTP response
 */
export const formatError = (
  error: Error,
  path?: string,
): ErrorResponse => {
  const appError = error instanceof AppError
    ? error
    : new AppError(error.message);
  
  return {
    statusCode: appError.httpStatus,
    error: HttpStatus[appError.httpStatus],
    message: appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
    path,
    details: appError.details,
  };
};

/**
 * Convert any error to an HTTP exception
 */
export const toHttpException = (error: unknown): HttpException => {
  if (error instanceof HttpException) {
    return error;
  }

  if (error instanceof AppError) {
    return new HttpException(
      {
        statusCode: error.httpStatus,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      error.httpStatus,
    );
  }

  // Default for unknown errors
  const message = error instanceof Error ? error.message : 'Internal server error';
  return new HttpException(
    {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
};

/**
 * Extract error message safely from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}; 