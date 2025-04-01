import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db!: Db;

  constructor() {
    const username = process.env.MONGO_INITDB_ROOT_USERNAME || 'admin';
    const password = process.env.MONGO_INITDB_ROOT_PASSWORD;
    const host = process.env.MONGO_HOST || 'localhost';
    const port = process.env.MONGO_PORT || '27017';

    const uri = `mongodb://${username}:${password}@${host}:${port}`;

    this.client = new MongoClient(uri);
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.db = this.client.db('chatti');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    console.log('MongoDB connection closed');
  }

  // Collection getters
  get users(): Collection {
    return this.db.collection('users');
  }
}
