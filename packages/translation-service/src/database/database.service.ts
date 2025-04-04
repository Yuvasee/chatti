import { Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TranslationDto } from '@chatti/shared-types';

@Injectable()
export class DatabaseService {
  private db: Db;
  private translationsCollection: Collection<TranslationDto>;

  constructor(@InjectConnection() private connection: Connection) {
    // Get the native MongoDB connection from Mongoose
    this.db = this.connection.db as Db;
    this.translationsCollection = this.db.collection<TranslationDto>('translations');
    
    // Initialize indexes
    this.initializeIndexes();
  }

  private async initializeIndexes() {
    // Create indexes for faster queries
    await this.translationsCollection.createIndex({ messageId: 1 });
    await this.translationsCollection.createIndex(
      {
        messageId: 1,
        targetLanguage: 1,
      },
      { unique: true },
    );
  }

  async saveTranslation(translation: Omit<TranslationDto, 'createdAt'>) {
    return this.translationsCollection.updateOne(
      {
        messageId: translation.messageId,
        targetLanguage: translation.targetLanguage,
      },
      {
        $set: {
          ...translation,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getTranslation(messageId: string, targetLanguage: string) {
    return this.translationsCollection.findOne({
      messageId,
      targetLanguage,
    });
  }

  async getTranslationsForMessages(messageIds: string[], targetLanguage: string) {
    return this.translationsCollection
      .find({
        messageId: { $in: messageIds },
        targetLanguage,
      })
      .toArray();
  }
}
