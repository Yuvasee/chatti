import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { SaveMessageDto } from '@chatti/shared-types';

@Injectable()
export class MessageService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  /**
   * Save a message to the database
   */
  async saveMessage(messageData: SaveMessageDto): Promise<Message> {
    const newMessage = new this.messageModel({
      ...messageData,
      translations: {},
    });

    return newMessage.save();
  }

  /**
   * Retrieve recent messages for a chat
   */
  async getRecentMessages(chatId: string, limit = 50): Promise<Message[]> {
    return this.messageModel.find({ chatId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  /**
   * Add a translation to a message
   */
  async addTranslation(
    messageId: string,
    language: string,
    translatedContent: string,
  ): Promise<Message | null> {
    return this.messageModel
      .findByIdAndUpdate(
        messageId,
        {
          $set: { [`translations.${language}`]: translatedContent },
        },
        { new: true },
      )
      .exec();
  }
}
