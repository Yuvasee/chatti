import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { MessageDto, PaginatedResponseDto, ApiErrorResponseDto } from '@chatti/shared-types';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get paginated messages for a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of messages per page', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages retrieved successfully', 
    type: () => PaginatedResponseDto<MessageDto>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid chat ID or parameters',
    type: ApiErrorResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Server error',
    type: ApiErrorResponseDto
  })
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<PaginatedResponseDto<MessageDto>> {
    return this.messageService.getPaginatedMessages(chatId, page, limit);
  }
} 