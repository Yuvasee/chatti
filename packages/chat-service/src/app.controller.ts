import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponseDto } from '@chatti/shared-types';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy', 
    type: HealthCheckResponseDto 
  })
  getStatus(): HealthCheckResponseDto {
    return {
      service: 'chat-service',
      status: 'online',
      version: this.configService.get('npm_package_version') || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
