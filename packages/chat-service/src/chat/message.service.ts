import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { 
  CreateMessageDto, 
  AppLogger, 
  ErrorCode, 
  AppError, 
  
  getErrorMessage,
  MessageDto,
  PaginatedResponseDto,
  PaginationMetaDto,
  MessageResponseDto
} from '@chatti/shared-types';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly logger: AppLogger
  ) {}

  /**
   * Save a message to the database
   */
  async saveMessage(messageData: CreateMessageDto): Promise<Message> {
    try {
      this.logger.log(`Saving message from ${messageData.username} in chat ${messageData.chatId}`);
      
      const newMessage = new this.messageModel({
        ...messageData,
        language: messageData.language || 'en', // Default to English if not provided
        translations: {},
      });

      const savedMessage = await newMessage.save();
      if (!savedMessage) {
        throw new AppError(
          'Failed to save message',
          ErrorCode.DATABASE_ERROR,
        );
      }
      
      this.logger.log(`Message saved with ID: ${(savedMessage as any)._id}`);
      return savedMessage;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in saveMessage: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Retrieve recent messages for a chat
   */
  async getRecentMessages(chatId: string, limit = 50): Promise<MessageResponseDto[]> {
    try {
      this.logger.log(`Retrieving recent messages for chat ${chatId} (limit: ${limit})`);
      
      const messages = await this.messageModel.find({ chatId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
      
      // Map MongoDB _id to id for frontend compatibility
      const mappedMessages: MessageResponseDto[] = messages.map(message => {
        // Use type assertion to work with the Mongoose document
        const messageDoc = message as any;
        
        return {
          id: messageDoc._id.toString(), // Convert MongoDB ObjectId to string
          chatId: messageDoc.chatId,
          userId: messageDoc.userId,
          username: messageDoc.username,
          content: messageDoc.content,
          translations: messageDoc.translations || {},
          createdAt: messageDoc.createdAt,
          language: messageDoc.language || 'en' // Default to English if not specified
        };
      });
      
      this.logger.debug(`Retrieved ${mappedMessages.length} messages for chat ${chatId}`);
      return mappedMessages;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in getRecentMessages: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Add a translation to a message
   */
  async addTranslation(
    messageId: string,
    language: string,
    translatedContent: string,
  ): Promise<Message | null> {
    try {
      this.logger.log(`Adding ${language} translation to message ${messageId}`);
      
      const message = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            $set: { [`translations.${language}`]: translatedContent },
          },
          { new: true },
        )
        .exec();
        
      if (!message) {
        this.logger.warn(`Failed to add translation: Message ${messageId} not found`);
        throw new AppError(`Message with ID ${messageId} not found`, ErrorCode.RECORD_NOT_FOUND);
      }
      
      this.logger.log(`Successfully added ${language} translation to message ${messageId}`);
      return message;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in addTranslation: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get paginated messages for a chat
   */
  async getPaginatedMessages(
    chatId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponseDto<MessageDto>> {
    try {
      this.logger.log(`Getting paginated messages for chat ${chatId}, page ${page}, limit ${limit}`);
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
      
      // Get messages with pagination
      const messages = await this.messageModel
        .find({ chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      
      // Count total messages for this chat
      const totalItems = await this.messageModel.countDocuments({ chatId }).exec();
      
      // Calculate total pages
      const totalPages = Math.ceil(totalItems / limit);
      
      // Create pagination metadata
      const meta = new PaginationMetaDto(
        page,
        limit,
        totalItems,
        totalPages,
        page < totalPages, // hasNextPage
        page > 1           // hasPreviousPage
      );
      
      this.logger.log(`Retrieved ${messages.length} messages for chat ${chatId}`);
      
      // Convert to DTOs and return
      const messageDtos = messages.map(message => ({
        chatId: message.chatId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        language: message.translations ? Object.keys(message.translations)[0] || 'en' : 'en'
      }));
      
      return new PaginatedResponseDto<MessageDto>(
        messageDtos,
        meta,
        `Retrieved ${messages.length} messages for chat ${chatId}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get paginated messages for chat ${chatId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new AppError(
        `Failed to get messages for chat: ${errorMessage}`,
        ErrorCode.DATABASE_ERROR
      );
    }
  }
}
