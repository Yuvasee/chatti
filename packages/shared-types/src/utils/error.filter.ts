import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCode, formatError } from './error-handling';
import { AppLogger } from './logging';

/**
 * Global exception filter for consistent error handling across all services
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;
    
    // Get logger from request if available or use the injected logger
    const logger = (request as any).logger || this.logger;
    
    // Extract error details
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
    const errorMessage = 
      exception instanceof HttpException
        ? typeof exception.getResponse() === 'object'
          ? (exception.getResponse() as any).message || exception.message
          : exception.message
        : exception.message || 'Internal server error';

    // Standard error response format 
    const errorResponse = formatError(exception, path);
    
    // Log the error
    logger.error(
      `Request error: ${errorMessage}`,
      exception.stack,
      {
        path,
        method: request.method,
        status,
      },
    );
    
    // Send response
    response.status(status).json(errorResponse);
  }
} 