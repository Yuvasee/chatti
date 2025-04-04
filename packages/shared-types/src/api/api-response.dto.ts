import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API success response with data
 */
export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: null, nullable: true })
  data: T;

  constructor(data: T, message: string = 'Operation completed successfully') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

/**
 * Standard API error response
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'An error occurred' })
  message: string;

  @ApiProperty({ example: 'INTERNAL_SERVER_ERROR', description: 'Error code' })
  code: string;

  @ApiProperty({ 
    example: { field: 'email', message: 'Email is invalid' },
    nullable: true,
    description: 'Additional error details',
    required: false
  })
  details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    this.success = false;
    this.message = message;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard API pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;

  constructor(
    page: number,
    limit: number,
    totalItems: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  ) {
    this.page = page;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = totalPages;
    this.hasNextPage = hasNextPage;
    this.hasPreviousPage = hasPreviousPage;
  }
}

/**
 * Standard API paginated response
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Items retrieved successfully' })
  message: string;

  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto, message: string = 'Items retrieved successfully') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

/**
 * Standard health check response
 */
export class HealthCheckResponseDto {
  @ApiProperty({ example: 'auth-service' })
  service: string;

  @ApiProperty({ example: 'online' })
  status: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: '2023-10-15T12:34:56.789Z' })
  timestamp: string;
  
  constructor(service: string, status: string, version: string, timestamp: string) {
    this.service = service;
    this.status = status;
    this.version = version;
    this.timestamp = timestamp;
  }
} 