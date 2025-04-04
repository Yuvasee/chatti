import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import { 
  AppLogger, 
  ErrorCode, 
  AppError, 
  handleError,
  getErrorMessage, 
  NotFoundError 
} from '@chatti/shared-types';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private readonly logger: AppLogger
  ) {}

  /**
   * Generates a chat ID in the format 123-456-789
   */
  generateChatId(): string {
    try {
      const part1 = Math.floor(Math.random() * 900) + 100; // 100-999
      const part2 = Math.floor(Math.random() * 900) + 100; // 100-999
      const part3 = Math.floor(Math.random() * 900) + 100; // 100-999

      const chatId = `${part1}-${part2}-${part3}`;
      this.logger.debug(`Generated chat ID: ${chatId}`);
      return chatId;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in generateChatId: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Creates a new chat with a unique ID
   */
  async createChat(userId: string): Promise<Chat> {
    try {
      this.logger.log(`Creating new chat for user ${userId}`);
      
      let chatId = this.generateChatId();
      let existingChat = await this.chatModel.findOne({ chatId }).exec();

      // Keep generating until we get a unique ID
      while (existingChat) {
        this.logger.debug(`Chat ID ${chatId} already exists, generating a new one`);
        chatId = this.generateChatId();
        existingChat = await this.chatModel.findOne({ chatId }).exec();
      }

      const newChat = new this.chatModel({
        chatId,
        participants: [userId],
        isActive: true,
      });

      const savedChat = await newChat.save();
      if (!savedChat) {
        throw new AppError(
          'Failed to create chat',
          ErrorCode.DATABASE_ERROR,
        );
      }
      
      this.logger.log(`Created new chat with ID ${chatId} for user ${userId}`);
      return savedChat;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in createChat: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Finds a chat by ID
   */
  async findChatById(chatId: string): Promise<Chat | null> {
    try {
      this.logger.debug(`Finding chat by ID: ${chatId}`);
      
      const chat = await this.chatModel.findOne({ chatId }).exec();
      
      if (!chat) {
        this.logger.debug(`Chat with ID ${chatId} not found`);
      } else {
        this.logger.debug(`Found chat with ID ${chatId}`);
      }
      
      return chat;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in findChatById: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Adds a participant to a chat
   */
  async addParticipant(chatId: string, userId: string): Promise<Chat | null> {
    try {
      this.logger.log(`Adding user ${userId} to chat ${chatId}`);
      
      const chat = await this.findChatById(chatId);

      if (!chat) {
        this.logger.warn(`Cannot add user ${userId} to non-existent chat ${chatId}`);
        return null;
      }

      if (!chat.participants.includes(userId)) {
        this.logger.debug(`User ${userId} is not already in chat ${chatId}, adding them`);
        
        const updatedChat = await this.chatModel
          .findOneAndUpdate({ chatId }, { $addToSet: { participants: userId } }, { new: true })
          .exec();
          
        this.logger.log(`User ${userId} successfully added to chat ${chatId}`);
        return updatedChat;
      }

      this.logger.debug(`User ${userId} is already in chat ${chatId}`);
      return chat;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in addParticipant: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
