import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { 
  CreateMessageDto, 
  AppLogger, 
  ErrorCode, 
  AppError, 
  handleError,
  getErrorMessage 
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
  async getRecentMessages(chatId: string, limit = 50): Promise<Message[]> {
    try {
      this.logger.log(`Retrieving recent messages for chat ${chatId} (limit: ${limit})`);
      
      const messages = await this.messageModel.find({ chatId }).sort({ createdAt: -1 }).limit(limit).exec();
      
      this.logger.debug(`Retrieved ${messages.length} messages for chat ${chatId}`);
      return messages;
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
}
