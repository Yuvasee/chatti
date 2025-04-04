import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getStatus(): any {
    return {
      service: 'chat-service',
      status: 'online',
      version: this.configService.get('npm_package_version') || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
