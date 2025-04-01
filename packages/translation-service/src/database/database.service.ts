import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Collection, Db } from 'mongodb';

interface Translation {
  messageId: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: Date;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;
  private translationsCollection!: Collection<Translation>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('MONGODB_URI');
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in configuration');
    }
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    this.translationsCollection = this.db.collection<Translation>('translations');

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

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  async saveTranslation(translation: Omit<Translation, 'createdAt'>) {
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
