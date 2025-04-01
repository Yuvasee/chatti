import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat/chat.service';

@Controller()
export class AppController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getStatus(): any {
    return {
      service: 'chat-service',
      status: 'online',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
