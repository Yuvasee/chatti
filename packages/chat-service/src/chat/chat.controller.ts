import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { 
  MessageDto, 
  PaginatedResponseDto, 
  ApiErrorResponseDto, 
  ApiResponseDto,
  TranslationNotificationDto 
} from '@chatti/shared-types';
import { ChatGateway } from './chat.gateway';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway
  ) {}

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

  @Post('translations/notify')
  @ApiOperation({ summary: 'Receive translation completion notification' })
  @ApiBody({ description: 'Translation notification data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Translation notification processed successfully', 
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Server error',
    type: ApiErrorResponseDto
  })
  async translationNotification(@Body() notification: TranslationNotificationDto): Promise<ApiResponseDto<{ success: boolean }>> {
    try {
      const { messageId, chatId, language, translatedContent } = notification;
      
      // First, save the translation to the message in the database
      await this.messageService.addTranslation(messageId, language, translatedContent);
      
      // Then notify all clients in the chat room about the translation
      this.chatGateway.notifyTranslation(messageId, chatId, language, translatedContent);
      
      return {
        success: true,
        data: { success: true },
        message: 'Translation notification processed successfully'
      };
    } catch (error) {
      console.error('Error processing translation notification:', error);
      throw error;
    }
  }
} 