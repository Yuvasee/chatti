import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
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
  getErrorMessage, 
  NotFoundError,
  SOCKET_EVENTS,
  AuthenticationError
} from '@chatti/shared-types';
import { TranslationProducerService } from '../queue/translation-producer.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { JwtService } from '../auth/jwt.service';

// Type for Socket.IO acknowledgment callback
type AckCallback = (response: { success: boolean; message?: string; data?: any }) => void;

@UseGuards(WsJwtGuard)
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
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connecting: ${client.id}`);
      
      // Extract and verify token
      const token = client.handshake.auth?.token;
      if (!token) {
        this.logger.warn(`No auth token provided by client ${client.id}`);
        client.emit('error', { 
          message: 'Authentication required', 
          code: ErrorCode.UNAUTHORIZED 
        });
        client.disconnect(true);
        return;
      }
      
      try {
        // Verify the token and extract user data
        const payload = this.jwtService.verifyToken(token);
        
        // Store user information in the socket data
        client.data.userId = payload.userId;
        client.data.username = payload.username;
        
        this.logger.log(`Client ${client.id} authenticated as ${payload.username} (${payload.userId})`);
      } catch (error) {
        this.logger.warn(`Invalid auth token from client ${client.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        client.emit('error', { 
          message: 'Authentication failed', 
          code: error instanceof AuthenticationError ? error.code : ErrorCode.UNAUTHORIZED
        });
        client.disconnect(true);
        return;
      }
      
      this.logger.log(`Client connected and authenticated: ${client.id}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleConnection: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      client.disconnect(true);
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

  @SubscribeMessage('create_chat')
  async handleCreateChat(
    @ConnectedSocket() client: Socket,
    ack: AckCallback
  ) {
    try {
      // Use authenticated user data from socket connection
      const userId = client.data.userId;
      const username = client.data.username;
      
      if (!userId || !username) {
        this.logger.warn(`Unauthenticated user attempting to create chat`);
        const errorResponse = {
          success: false,
          message: 'Authentication required',
          code: ErrorCode.UNAUTHORIZED
        };
        
        client.emit(SOCKET_EVENTS.ERROR, { 
          message: 'Authentication required', 
          code: ErrorCode.UNAUTHORIZED 
        });
        
        if (ack) {
          ack(errorResponse);
        }
        
        return errorResponse;
      }
      
      this.logger.log(`User ${username} (${userId}) attempting to create a new chat`);
      
      // Create a new chat
      const chat = await this.chatService.createChat(userId);
      
      this.logger.log(`Created new chat with ID ${chat.chatId} for user ${userId}`);
      
      // Create the response using SocketResponseDto format
      const response = {
        success: true,
        data: { chatId: chat.chatId }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(response);
      }
      
      // Return response for WebSocket subscribers
      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleCreateChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to create chat: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      client.emit('error', { 
        message: 'Failed to create chat', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      // Send acknowledgment with error
      if (ack) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: JoinChatDto,
    ack: AckCallback
  ) {
    try {
      const { chatId } = payload;
      
      // Use authenticated user data from socket connection
      const userId = client.data.userId;
      const username = client.data.username;
      
      if (!userId || !username) {
        this.logger.warn(`Unauthenticated user attempting to join chat ${chatId}`);
        const errorResponse = {
          success: false,
          message: 'Authentication required',
          code: ErrorCode.UNAUTHORIZED
        };
        
        client.emit(SOCKET_EVENTS.ERROR, { 
          message: 'Authentication required', 
          code: ErrorCode.UNAUTHORIZED 
        });
        
        if (ack) {
          ack(errorResponse);
        }
        
        return errorResponse;
      }
      
      this.logger.log(`User ${username} (${userId}) attempting to join chat ${chatId}`);

      // Join the Socket.IO room
      client.join(chatId);

      // Store chat data in socket
      client.data.chatId = chatId;
      client.data.language = 'en'; // Default language

      // Add user to chat in database
      const chat = await this.chatService.addParticipant(chatId, userId);

      if (!chat) {
        this.logger.warn(`Chat not found: ${chatId}`);
        
        const notFoundResponse = {
          success: false,
          message: 'Chat not found',
          code: ErrorCode.CHAT_NOT_FOUND
        };
        
        client.emit(SOCKET_EVENTS.ERROR, { message: 'Chat not found', code: ErrorCode.CHAT_NOT_FOUND });
        
        // Send acknowledgment with error
        if (ack) {
          ack(notFoundResponse);
        }
        
        return notFoundResponse;
      }

      // Get recent messages
      const recentMessages = await this.messageService.getRecentMessages(chatId);

      // Notify room that user has joined
      this.server.to(chatId).emit(SOCKET_EVENTS.USER_JOINED, {
        chatId,
        userId,
        username,
        timestamp: new Date(),
      });

      this.logger.log(`User ${username} (${userId}) successfully joined chat ${chatId}`);
      
      // Create success response with recent messages included
      const successResponse = {
        success: true,
        data: { 
          chatId,
          recentMessages 
        }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleJoinChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to join chat: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      // Only emit error if it's not already a NotFoundError (which we've already handled)
      if (!(error instanceof NotFoundError)) {
        client.emit('error', { 
          message: 'Failed to join chat', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      // Send acknowledgment with error if not already sent
      if (ack && !(error instanceof NotFoundError)) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CHAT)
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
    ack: AckCallback
  ) {
    try {
      if (!client.data.chatId) {
        this.logger.warn(`User attempted to leave chat but is not in any chat`);
        
        const errorResponse = {
          success: false,
          message: 'Not in a chat',
          code: ErrorCode.NOT_CHAT_MEMBER
        };
        
        // Send acknowledgment with error
        if (ack) {
          ack(errorResponse);
        }
        
        return errorResponse;
      }
      
      const { chatId, userId, username } = client.data;
      this.logger.log(`User ${username} (${userId}) leaving chat ${chatId}`);
      
      client.leave(chatId);

      // Notify room that user has left
      this.server.to(chatId).emit(SOCKET_EVENTS.USER_LEFT, {
        chatId,
        userId,
        username,
        timestamp: new Date(),
      });

      this.logger.log(`User ${username} (${userId}) successfully left chat ${chatId}`);
      
      const successResponse = {
        success: true,
        data: { chatId }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleLeaveChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to leave chat: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      client.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Failed to leave chat', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      // Send acknowledgment with error
      if (ack) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.NEW_MESSAGE)
  async handleMessage(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: MessageDto,
    ack: AckCallback
  ) {
    try {
      const { chatId, userId, username, content, language } = payload;
      this.logger.log(`Message received from ${username} (${userId}) in chat ${chatId}`);

      // Validate that user is in this chat
      if (client.data.chatId !== chatId) {
        this.logger.warn(`User ${username} (${userId}) attempted to send message to chat ${chatId} but is not a member`);
        client.emit(SOCKET_EVENTS.ERROR, { 
          message: 'Not in this chat', 
          code: ErrorCode.NOT_CHAT_MEMBER 
        });
        
        // Send acknowledgment with error
        if (ack) {
          ack({ 
            success: false, 
            message: 'Not in this chat' 
          });
        }
        
        throw new AppError('User is not a member of this chat', ErrorCode.NOT_CHAT_MEMBER);
      }

      // Asynchronously save message to database first to get the real ID
      const savedMessage = await this.messageService.saveMessage({
        chatId,
        userId,
        username,
        content,
      });

      // Get the MongoDB generated ID and convert to string
      const messageId = (savedMessage as any)._id.toString();

      // Broadcast message to all clients in the room with proper ID mapping
      const messageData = {
        id: messageId, // Use the real MongoDB ID
        chatId,
        userId,
        username,
        content,
        language: language || 'en',
        translations: {},
        createdAt: new Date(),
      };

      this.server.to(chatId).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

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
          messageId: messageId, // Use string ID
          chatId,
          content,
          sourceLanguage: language || 'en',
          targetLanguage,
        });
      }

      this.logger.log(`Message from ${username} (${userId}) in chat ${chatId} processed successfully`);
      
      const successResponse = {
        success: true, 
        data: { messageId: messageId } // Return string ID
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleMessage: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to send message: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      // Only emit if not already handled
      if (!(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        client.emit('error', { 
          message: 'Failed to send message', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      // Send acknowledgment with error if not already sent
      if (ack && !(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }

  @SubscribeMessage('set_language')
  handleSetLanguage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
    ack: AckCallback
  ) {
    try {
      const { language } = payload;
      const { userId, username } = client.data;
      
      this.logger.log(`User ${username || userId} setting language to ${language}`);
      client.data.language = language;
      
      const successResponse = {
        success: true,
        data: { language }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleSetLanguage: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to set language: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      client.emit('error', { 
        message: 'Failed to set language', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      // Send acknowledgment with error
      if (ack) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }

  @SubscribeMessage('get_message_history')
  async handleGetMessageHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; limit?: number },
    ack: AckCallback
  ) {
    try {
      const { chatId, limit = 50 } = payload;
      this.logger.log(`Fetching message history for chat ${chatId}, limit: ${limit}`);

      // Validate that user is in this chat
      if (client.data.chatId !== chatId) {
        this.logger.warn(`User attempted to fetch history for chat ${chatId} but is not a member`);
        client.emit(SOCKET_EVENTS.ERROR, { 
          message: 'Not in this chat', 
          code: ErrorCode.NOT_CHAT_MEMBER 
        });
        
        // Send acknowledgment with error
        if (ack) {
          ack({ 
            success: false, 
            message: 'Not in this chat' 
          });
        }
        
        throw new AppError('User is not a member of this chat', ErrorCode.NOT_CHAT_MEMBER);
      }

      const messages = await this.messageService.getRecentMessages(chatId, limit);
      
      const successResponse = {
        success: true,
        data: { messages }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleGetMessageHistory: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to fetch message history: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      // Only emit if not already handled
      if (!(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        client.emit('error', { 
          message: 'Failed to fetch message history', 
          code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
        });
      }
      
      // Send acknowledgment with error if not already sent
      if (ack && !(error instanceof AppError && error.code === ErrorCode.NOT_CHAT_MEMBER)) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
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
      
      // Ensure messageId is a string
      const idToSend = messageId;
      
      this.server.to(chatId).emit(SOCKET_EVENTS.TRANSLATION_COMPLETE, {
        messageId: idToSend,
        language,
        translatedContent,
      });
      
      this.logger.debug(`Translation notification sent for message ${idToSend}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in notifyTranslation: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    try {
      // ... existing implementation ...
    } catch (error) {
      // ... existing error handling ...
    }
  }
  
  @SubscribeMessage(SOCKET_EVENTS.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    try {
      // ... existing implementation ...
    } catch (error) {
      // ... existing error handling ...
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.LANGUAGE_CHANGE)
  async handleLanguageChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
    ack: AckCallback
  ) {
    try {
      const { language } = payload;
      const { userId, username, chatId } = client.data;
      
      if (!chatId) {
        this.logger.warn(`User ${username || userId} attempted to change language but is not in a chat room`);
        
        const errorResponse = {
          success: false,
          message: 'Not in a chat room',
          code: ErrorCode.NOT_CHAT_MEMBER
        };
        
        // Send acknowledgment with error
        if (ack) {
          ack(errorResponse);
        }
        
        return errorResponse;
      }
      
      this.logger.log(`User ${username || userId} changing language to ${language}`);
      
      // Store user's language preference in socket data
      client.data.language = language;
      
      // Get recent messages from this chat
      const recentMessages = await this.messageService.getRecentMessages(chatId, 20);
      
      // Queue translation jobs for messages that aren't from this user and don't have a translation in the requested language
      for (const message of recentMessages) {
        if (message.userId !== userId) {
          const messageId = message.id; // Now we can directly access id property
          const sourceLanguage = message.language;
          
          // Check if we already have this translation
          if (!message.translations || !message.translations[language]) {
            this.logger.debug(`Queueing translation for message ${messageId} from ${sourceLanguage} to ${language}`);
            
            // Add translation job to the queue
            await this.translationProducer.addTranslationJob({
              messageId,
              chatId,
              content: message.content,
              sourceLanguage,
              targetLanguage: language,
            });
          }
        }
      }
      
      const successResponse = {
        success: true,
        data: { language }
      };
      
      // Send acknowledgment of success
      if (ack) {
        ack(successResponse);
      }
      
      // Return success response for WebSocket subscribers
      return successResponse;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in handleLanguageChange: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      const errorResponse = {
        success: false,
        message: 'Failed to change language: ' + errorMessage,
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR
      };
      
      client.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Failed to change language', 
        code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR 
      });
      
      // Send acknowledgment with error
      if (ack) {
        ack(errorResponse);
      }
      
      // Return error response for WebSocket subscribers
      return errorResponse;
    }
  }
}
