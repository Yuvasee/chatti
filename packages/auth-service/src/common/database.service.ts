import { Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  private db: Db;

  constructor(@InjectConnection() private connection: Connection) {
    // Get the native MongoDB connection from Mongoose
    this.db = this.connection.db as Db;
  }

  // Collection getters
  get users(): Collection {
    return this.db.collection('users');
  }
}
