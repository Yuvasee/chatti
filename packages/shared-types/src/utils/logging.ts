import { LoggerService, LogLevel } from '@nestjs/common';

/**
 * Log context information
 */
export interface LogContext {
  service: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Configuration options for the AppLogger
 */
export interface AppLoggerOptions {
  serviceName: string;
  logLevels?: LogLevel[];
}

/**
 * Format log messages consistently across all services
 */
export const formatLogMessage = (
  message: string,
  context?: string | LogContext,
): string => {
  if (!context) {
    return message;
  }

  if (typeof context === 'string') {
    return `[${context}] ${message}`;
  }

  const { service, requestId, userId, ...rest } = context;
  let formattedMessage = `[${service}]`;

  if (requestId) {
    formattedMessage += ` [reqId:${requestId}]`;
  }

  if (userId) {
    formattedMessage += ` [userId:${userId}]`;
  }

  // Add any additional context as tags
  const additionalContext = Object.entries(rest)
    .map(([key, value]) => `[${key}:${value}]`)
    .join(' ');

  if (additionalContext) {
    formattedMessage += ` ${additionalContext}`;
  }

  formattedMessage += ` ${message}`;
  return formattedMessage;
};

/**
 * Custom logger service that can be used across all microservices
 */
export class AppLogger implements LoggerService {
  private readonly serviceName: string;
  private readonly logLevels: LogLevel[];

  constructor(options: AppLoggerOptions) {
    this.serviceName = options.serviceName;
    this.logLevels = options.logLevels || ['log', 'error', 'warn', 'debug', 'verbose'];
  }

  /**
   * Log a message
   */
  log(message: any, context?: string | LogContext): void {
    if (!this.isLevelEnabled('log')) return;
    
    const ctx = typeof context === 'string' 
      ? { service: this.serviceName } 
      : { ...context, service: this.serviceName };
    
    console.log(formatLogMessage(message, ctx));
  }

  /**
   * Log an error
   */
  error(message: any, trace?: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled('error')) return;
    
    const ctx = typeof context === 'string' 
      ? { service: this.serviceName } 
      : { ...context, service: this.serviceName };
    
    console.error(formatLogMessage(message, ctx));
    
    if (trace) {
      console.error(trace);
    }
  }

  /**
   * Log a warning
   */
  warn(message: any, context?: string | LogContext): void {
    if (!this.isLevelEnabled('warn')) return;
    
    const ctx = typeof context === 'string' 
      ? { service: this.serviceName } 
      : { ...context, service: this.serviceName };
    
    console.warn(formatLogMessage(message, ctx));
  }

  /**
   * Log debug information
   */
  debug(message: any, context?: string | LogContext): void {
    if (!this.isLevelEnabled('debug')) return;
    
    const ctx = typeof context === 'string' 
      ? { service: this.serviceName } 
      : { ...context, service: this.serviceName };
    
    console.debug(formatLogMessage(message, ctx));
  }

  /**
   * Log verbose information
   */
  verbose(message: any, context?: string | LogContext): void {
    if (!this.isLevelEnabled('verbose')) return;
    
    const ctx = typeof context === 'string' 
      ? { service: this.serviceName } 
      : { ...context, service: this.serviceName };
    
    console.log(formatLogMessage(message, ctx));
  }

  /**
   * Set log levels
   */
  setLogLevels(levels: LogLevel[]): void {
    this.logLevels.length = 0;
    this.logLevels.push(...levels);
  }

  /**
   * Check if a log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }

  /**
   * Generate a request logger for HTTP requests
   */
  getRequestLogger(requestId: string, userId?: string): AppLogger {
    return {
      ...this,
      log: (message: any, context?: string | LogContext) => {
        const ctx = typeof context === 'string'
          ? { service: this.serviceName, requestId, userId }
          : { ...context, service: this.serviceName, requestId, userId };
        
        this.log(message, ctx);
      },
      error: (message: any, trace?: string, context?: string | LogContext) => {
        const ctx = typeof context === 'string'
          ? { service: this.serviceName, requestId, userId }
          : { ...context, service: this.serviceName, requestId, userId };
        
        this.error(message, trace, ctx);
      },
      warn: (message: any, context?: string | LogContext) => {
        const ctx = typeof context === 'string'
          ? { service: this.serviceName, requestId, userId }
          : { ...context, service: this.serviceName, requestId, userId };
        
        this.warn(message, ctx);
      },
      debug: (message: any, context?: string | LogContext) => {
        const ctx = typeof context === 'string'
          ? { service: this.serviceName, requestId, userId }
          : { ...context, service: this.serviceName, requestId, userId };
        
        this.debug(message, ctx);
      },
      verbose: (message: any, context?: string | LogContext) => {
        const ctx = typeof context === 'string'
          ? { service: this.serviceName, requestId, userId }
          : { ...context, service: this.serviceName, requestId, userId };
        
        this.verbose(message, ctx);
      },
      setLogLevels: this.setLogLevels.bind(this),
      getRequestLogger: () => this, // Just return this instance to avoid nesting
    } as AppLogger;
  }
} 