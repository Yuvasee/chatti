import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCode, formatError, AppError } from './error-handling';
import { AppLogger } from './logging';
import { ApiErrorResponseDto } from '../api';

/**
 * Global exception filter for consistent error handling across all services
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get request-specific logger if available
    const requestLogger = (request as any).logger || this.logger;

    // Get error details
    const status = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const code = this.getErrorCode(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    const details = this.getErrorDetails(exception);

    // Log the error
    requestLogger.error(
      `Exception: ${message}`, 
      {
        path: request.url,
        method: request.method,
        statusCode: status,
        errorCode: code,
      },
      stack
    );

    // Send the response
    response
      .status(status)
      .json(new ApiErrorResponseDto(message, code, details));
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null && 'message' in response) {
        return Array.isArray(response.message) 
          ? response.message.join(', ')
          : String(response.message);
      }
      return exception.message || 'Internal server error';
    }
    return exception instanceof Error ? exception.message : 'Internal server error';
  }

  private getErrorCode(exception: unknown): string {
    if (exception instanceof AppError) {
      return exception.code;
    }
    
    if (exception instanceof HttpException) {
      switch (exception.getStatus()) {
        case HttpStatus.BAD_REQUEST:
          return ErrorCode.VALIDATION_ERROR;
        case HttpStatus.UNAUTHORIZED:
          return ErrorCode.UNAUTHORIZED;
        case HttpStatus.FORBIDDEN:
          return ErrorCode.UNAUTHORIZED;
        case HttpStatus.NOT_FOUND:
          return ErrorCode.RECORD_NOT_FOUND;
        case HttpStatus.CONFLICT:
          return ErrorCode.DUPLICATE_ENTRY;
        default:
          return ErrorCode.INTERNAL_SERVER_ERROR;
      }
    }
    
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(exception: unknown): Record<string, any> {
    if (exception instanceof AppError && exception.details) {
      return exception.details;
    }
    
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        // Extract any useful properties except 'message' which we already handle
        const { message, ...rest } = response as any;
        if (Object.keys(rest).length > 0) {
          return rest;
        }
      }
    }
    
    return {};
  }
} 