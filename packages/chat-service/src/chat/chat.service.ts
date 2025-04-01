import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  /**
   * Generates a chat ID in the format 111-222-333
   */
  generateChatId(): string {
    const part1 = Math.floor(Math.random() * 900) + 100; // 100-999
    const part2 = Math.floor(Math.random() * 900) + 100; // 100-999
    const part3 = Math.floor(Math.random() * 900) + 100; // 100-999

    return `${part1}-${part2}-${part3}`;
  }

  /**
   * Creates a new chat with a unique ID
   */
  async createChat(userId: string): Promise<Chat> {
    let chatId = this.generateChatId();
    let existingChat = await this.chatModel.findOne({ chatId }).exec();

    // Keep generating until we get a unique ID
    while (existingChat) {
      chatId = this.generateChatId();
      existingChat = await this.chatModel.findOne({ chatId }).exec();
    }

    const newChat = new this.chatModel({
      chatId,
      participants: [userId],
      isActive: true,
    });

    return newChat.save();
  }

  /**
   * Finds a chat by ID
   */
  async findChatById(chatId: string): Promise<Chat | null> {
    return this.chatModel.findOne({ chatId }).exec();
  }

  /**
   * Adds a participant to a chat
   */
  async addParticipant(chatId: string, userId: string): Promise<Chat | null> {
    const chat = await this.findChatById(chatId);

    if (!chat) {
      return null;
    }

    if (!chat.participants.includes(userId)) {
      return this.chatModel
        .findOneAndUpdate({ chatId }, { $addToSet: { participants: userId } }, { new: true })
        .exec();
    }

    return chat;
  }
}
