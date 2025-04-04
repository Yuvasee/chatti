import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppLogger, LogContext } from './logging';

/**
 * Middleware to log HTTP requests and responses
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    const userId = req.headers['x-user-id'] as string;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;

    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);

    // Create a request-specific logger instance with the request ID
    const requestLogger = this.logger.getRequestLogger(requestId, userId);

    // Log request
    requestLogger.log(`Incoming request`, {
      service: this.logger['serviceName'],
      method,
      path: url,
      userAgent,
      ip,
    } as LogContext);

    // Calculate request time
    const startTime = Date.now();

    // Capture the original end method
    const originalEnd = res.end;
    
    // Override the end method
    res.end = function(this: Response, chunk?: any, encoding?: any): Response {
      // Restore the original end method
      res.end = originalEnd;
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Log response
      requestLogger.log(`Response sent`, {
        service: (requestLogger as any)['serviceName'],
        method,
        path: url,
        statusCode,
        duration: `${duration}ms`,
      } as LogContext);
      
      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };

    // Add request logger to the request object for controllers to use
    (req as any).logger = requestLogger;

    next();
  }
} 