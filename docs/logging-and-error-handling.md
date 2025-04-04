# Logging and Error Handling in Chatti Microservices

This document outlines the standardized approach to logging and error handling across all Chatti microservices.

## Table of Contents

- [Logging Strategy](#logging-strategy)
  - [Setup](#logging-setup)
  - [Usage](#logging-usage)
  - [Request Logging](#request-logging)
- [Error Handling](#error-handling)
  - [Standard Error Types](#standard-error-types)
  - [Error Response Format](#error-response-format)
  - [Service-Level Error Handling](#service-level-error-handling)
  - [Controller-Level Error Handling](#controller-level-error-handling)

## Logging Strategy

Chatti implements a consistent logging strategy across all microservices using a custom `AppLogger` that wraps the NestJS Logger functionality.

### Logging Setup

To set up logging in a service:

1. Import the `LoggingModule` in your app module:

```typescript
import { LoggingModule } from '@chatti/shared-types';

@Module({
  imports: [
    // ...other imports
    LoggingModule.forRoot({
      serviceName: 'your-service-name',
    }),
    // ...other modules
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
```

2. Configure the main.ts file:

```typescript
import { AppLogger, GlobalExceptionFilter } from '@chatti/shared-types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Get the logger instance
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  
  // Add global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  
  // ...rest of bootstrap
}
```

### Logging Usage

Inject the AppLogger into your services and controllers:

```typescript
import { AppLogger } from '@chatti/shared-types';

@Injectable()
export class YourService {
  constructor(private readonly logger: AppLogger) {}
  
  someMethod() {
    this.logger.log('This is a standard log message');
    this.logger.error('Something went wrong', errorStack);
    this.logger.warn('Something needs attention');
    this.logger.debug('Debug information');
    this.logger.verbose('Detailed operation info');
  }
}
```

You can also add context to your logs:

```typescript
this.logger.log('Processing request', {
  requestId: 'req-123',
  userId: 'user-456',
  action: 'login',
});
```

### Request Logging

The `RequestLoggerMiddleware` automatically logs HTTP requests and responses:

- **Incoming requests**: Logs method, path, user agent, and IP
- **Outgoing responses**: Logs method, path, status code, and duration

It also adds a unique request ID to each request and makes the logger available via `req.logger`.

## Error Handling

Chatti provides a consistent error handling mechanism across all services.

### Standard Error Types

All errors extend from the base `AppError` class:

- `AppError`: Base error class with code, HTTP status, and details
- `AuthenticationError`: For auth-related errors
- `NotFoundError`: For resource not found errors
- `ValidationError`: For validation failures

### Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "timestamp": "2023-06-15T10:30:45.123Z",
  "path": "/api/some/endpoint",
  "details": {
    // optional additional details
  }
}
```

### Service-Level Error Handling

Services should handle errors using try/catch blocks and the provided utility functions:

```typescript
import { handleError, AppError, ErrorCode } from '@chatti/shared-types';

@Injectable()
export class YourService {
  constructor(private readonly logger: AppLogger) {}
  
  async someMethod() {
    try {
      // Your logic here
      
      if (somethingWrong) {
        throw new AppError(
          'Something went wrong',
          ErrorCode.SOME_ERROR_CODE,
        );
      }
      
      return result;
    } catch (error) {
      // Log and rethrow
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in someMethod: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
```

### Controller-Level Error Handling

Controllers don't need explicit error handling because the `GlobalExceptionFilter` will catch all unhandled exceptions and format them according to the standard error response.

## Error Codes

The `ErrorCode` enum provides a standardized set of error codes for all services:

```typescript
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  // ... and many more
}
```

## Best Practices

1. **Be consistent**: Use the provided logger and error classes in all services
2. **Add context**: Include relevant context in log messages like user IDs and request IDs
3. **Use appropriate log levels**: INFO for normal operations, ERROR for exceptions, DEBUG for detailed information
4. **Include stack traces**: Always include the error stack trace when logging errors
5. **Use typed errors**: Create specific error types for different error scenarios
6. **Handle async errors**: Always use try/catch blocks in async methods

## Example Implementation

See the auth-service for a reference implementation of these logging and error handling patterns.