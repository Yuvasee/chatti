import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { 
  JoinChatDto, 
  MessageDto, 
  AppLogger, 
  ErrorCode, 
  AppError, 
  handleError,
  getErrorMessage, 
  NotFoundError 
} from '@chatti/shared-types';
import { TranslationProducerService } from '../queue/translation-producer.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, this should be restricted
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private translationProducer: TranslationProducerService,
    private readonly logger: AppLogger,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleConnection: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleDisconnect: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinChatDto) {
    try {
      const { chatId, userId, username } = payload;
      this.logger.log(`User ${username} (${userId}) attempting to join chat ${chatId}`);

      // Join the Socket.IO room
      client.join(chatId);

      // Store user data in socket
      client.data.userId = userId;
      client.data.username = username;
      client.data.chatId = chatId;
      client.data.language = 'en'; // Default language

      // Add user to chat in database
      const chat = await this.chatService.addParticipant(chatId, userId);

      if (!chat) {
        this.logger.warn(`Chat not found: ${chatId}`);
        client.emit('error', { message: 'Chat not found', code: ErrorCode.CHAT_NOT_FOUND });
        throw new NotFoundError(`Chat with ID ${chatId} not found`, ErrorCode.CHAT_NOT_FOUND);
      }

      // Send recent messages to the client
      const recentMessages = await this.messageService.getRecentMessages(chatId);
      client.emit('recentMessages', recentMessages);

      // Notify room that user has joined
      this.server.to(chatId).emit('userJoined', {
        chatId,
        userId,
        username,
        timestamp: new Date(),
      });

      this.logger.log(`User ${username} (${userId}) successfully joined chat ${chatId}`);
      return { status: 'success', chatId };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleJoinChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      // Only emit error if it's not already a NotFoundError (which we've already handled)
      if (!(error instanceof NotFoundError)) {
        client.emit('error', { 
          message: 'Failed to join chat', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      return { 
        status: 'error', 
        message: errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(@ConnectedSocket() client: Socket) {
    try {
      if (!client.data.chatId) {
        this.logger.warn(`User attempted to leave chat but is not in any chat`);
        return { status: 'error', message: 'Not in a chat', code: ErrorCode.NOT_CHAT_MEMBER };
      }
      
      const { chatId, userId, username } = client.data;
      this.logger.log(`User ${username} (${userId}) leaving chat ${chatId}`);
      
      client.leave(chatId);

      // Notify room that user has left
      this.server.to(chatId).emit('userLeft', {
        chatId,
        userId,
        username,
        timestamp: new Date(),
      });

      this.logger.log(`User ${username} (${userId}) successfully left chat ${chatId}`);
      return { status: 'success' };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleLeaveChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      client.emit('error', { 
        message: 'Failed to leave chat', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      return { 
        status: 'error', 
        message: errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: MessageDto) {
    try {
      const { chatId, userId, username, content, language } = payload;
      this.logger.log(`Message received from ${username} (${userId}) in chat ${chatId}`);

      // Validate that user is in this chat
      if (client.data.chatId !== chatId) {
        this.logger.warn(`User ${username} (${userId}) attempted to send message to chat ${chatId} but is not a member`);
        client.emit('error', { 
          message: 'Not in this chat', 
          code: ErrorCode.NOT_CHAT_MEMBER 
        });
        throw new AppError('User is not a member of this chat', ErrorCode.NOT_CHAT_MEMBER);
      }

      // Broadcast message to all clients in the room immediately
      const messageData = {
        id: Date.now().toString(), // Temporary ID until saved
        chatId,
        userId,
        username,
        content,
        translations: {},
        createdAt: new Date(),
      };

      this.server.to(chatId).emit('messageReceived', messageData);

      // Asynchronously save message to database
      const savedMessage = await this.messageService.saveMessage({
        chatId,
        userId,
        username,
        content,
      });

      // Queue translation jobs for all users in the chat with different languages
      const connectedSockets = await this.server.in(chatId).fetchSockets();
      const uniqueLanguages = new Set<string>();

      // Add all languages from connected clients
      for (const socket of connectedSockets) {
        if (socket.data.language && socket.data.language !== language) {
          uniqueLanguages.add(socket.data.language);
        }
      }

      // Add translation jobs to the queue
      for (const targetLanguage of uniqueLanguages) {
        await this.translationProducer.addTranslationJob({
          messageId: (savedMessage as any)._id,
          chatId,
          content,
          sourceLanguage: language,
          targetLanguage,
        });
      }

      this.logger.log(`Message from ${username} (${userId}) in chat ${chatId} processed successfully`);
      return { status: 'success', messageId: (savedMessage as any)._id };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleMessage: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      // Only emit if not already handled
      if (!(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        client.emit('error', { 
          message: 'Failed to send message', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      return { 
        status: 'error', 
        message: errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  @SubscribeMessage('setLanguage')
  handleSetLanguage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
  ) {
    try {
      const { language } = payload;
      const { userId, username } = client.data;
      
      this.logger.log(`User ${username || userId} setting language to ${language}`);
      client.data.language = language;
      
      return { status: 'success', language };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleSetLanguage: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      client.emit('error', { 
        message: 'Failed to set language', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      return { 
        status: 'error', 
        message: errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  @SubscribeMessage('getMessageHistory')
  async handleGetMessageHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; limit?: number },
  ) {
    try {
      const { chatId, limit } = payload;
      const { userId, username } = client.data;
      
      this.logger.log(`User ${username || userId} requesting message history for chat ${chatId}`);

      // Validate that user is in this chat
      if (client.data.chatId !== chatId) {
        this.logger.warn(`User ${username || userId} attempted to get history for chat ${chatId} but is not a member`);
        client.emit('error', { 
          message: 'Not in this chat', 
          code: ErrorCode.NOT_CHAT_MEMBER 
        });
        throw new AppError('User is not a member of this chat', ErrorCode.NOT_CHAT_MEMBER);
      }

      const messages = await this.messageService.getRecentMessages(chatId, limit);
      this.logger.log(`Successfully retrieved ${messages.length} messages for chat ${chatId}`);
      
      return { status: 'success', messages };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleGetMessageHistory: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      if (!(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        client.emit('error', { 
          message: 'Failed to get message history', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      return { 
        status: 'error', 
        message: errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  notifyTranslation(
    messageId: string,
    chatId: string,
    language: string,
    translatedContent: string,
  ) {
    try {
      this.logger.log(`Notifying chat ${chatId} about translation for message ${messageId} to ${language}`);
      
      this.server.to(chatId).emit('messageTranslated', {
        messageId,
        language,
        translatedContent,
      });
      
      this.logger.debug(`Translation notification sent for message ${messageId}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in notifyTranslation: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
