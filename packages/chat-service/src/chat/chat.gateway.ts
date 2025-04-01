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
import { Logger } from '@nestjs/common';
import { TranslationProducerService } from '../queue/translation-producer.service';

interface JoinChatPayload {
  chatId: string;
  userId: string;
  username: string;
}

interface MessagePayload {
  chatId: string;
  userId: string;
  username: string;
  content: string;
  language: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, this should be restricted
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private translationProducer: TranslationProducerService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinChatPayload) {
    const { chatId, userId, username } = payload;

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
      client.emit('error', { message: 'Chat not found' });
      return;
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

    return { status: 'success', chatId };
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(@ConnectedSocket() client: Socket) {
    if (client.data.chatId) {
      client.leave(client.data.chatId);

      // Notify room that user has left
      this.server.to(client.data.chatId).emit('userLeft', {
        chatId: client.data.chatId,
        userId: client.data.userId,
        username: client.data.username,
        timestamp: new Date(),
      });

      return { status: 'success' };
    }

    return { status: 'error', message: 'Not in a chat' };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: MessagePayload) {
    const { chatId, userId, username, content, language } = payload;

    // Validate that user is in this chat
    if (client.data.chatId !== chatId) {
      client.emit('error', { message: 'Not in this chat' });
      return { status: 'error', message: 'Not in this chat' };
    }

    try {
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

      return { status: 'success', messageId: (savedMessage as any)._id };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error sending message: ${err.message}`, err.stack);
      client.emit('error', { message: 'Failed to send message' });
      return { status: 'error', message: 'Failed to send message' };
    }
  }

  @SubscribeMessage('setLanguage')
  handleSetLanguage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
  ) {
    const { language } = payload;
    client.data.language = language;
    return { status: 'success', language };
  }

  @SubscribeMessage('getMessageHistory')
  async handleGetMessageHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; limit?: number },
  ) {
    const { chatId, limit } = payload;

    // Validate that user is in this chat
    if (client.data.chatId !== chatId) {
      client.emit('error', { message: 'Not in this chat' });
      return { status: 'error', message: 'Not in this chat' };
    }

    try {
      const messages = await this.messageService.getRecentMessages(chatId, limit);
      return { status: 'success', messages };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error getting message history: ${err.message}`, err.stack);
      return { status: 'error', message: 'Failed to get message history' };
    }
  }

  // This method will be called when a translation is completed
  notifyTranslation(
    messageId: string,
    chatId: string,
    language: string,
    translatedContent: string,
  ) {
    this.server.to(chatId).emit('translationReceived', {
      messageId,
      language,
      translatedContent,
    });
  }
}
