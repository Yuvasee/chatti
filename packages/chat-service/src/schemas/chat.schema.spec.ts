import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Connection, connect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Chat, ChatSchema } from './chat.schema';

describe('Chat Schema', () => {
  let chatModel: Model<Chat>;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
      ],
    }).compile();

    chatModel = module.get<Model<Chat>>(getModelToken(Chat.name));
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  it('should create a chat with valid data', async () => {
    const chatData = {
      chatId: 'chat-123',
      participants: ['user1', 'user2'],
      isActive: true,
    };
    
    const chat = new chatModel(chatData);
    const savedChat = await chat.save();
    
    expect(savedChat.chatId).toBe(chatData.chatId);
    expect(savedChat.participants).toEqual(chatData.participants);
    expect(savedChat.isActive).toBe(chatData.isActive);
    expect(savedChat._id).toBeDefined();
  });

  it('should enforce unique chatId constraint', async () => {
    const chatData1 = {
      chatId: 'unique-chat-id',
      participants: ['user1'],
    };
    
    const chatData2 = {
      chatId: 'unique-chat-id',
      participants: ['user2'],
    };
    
    const chat1 = new chatModel(chatData1);
    await chat1.save();
    
    const chat2 = new chatModel(chatData2);
    await expect(chat2.save()).rejects.toThrow();
  });

  it('should use default values when not provided', async () => {
    const chatData = {
      chatId: 'default-chat',
      participants: ['user1'],
    };
    
    const chat = new chatModel(chatData);
    const savedChat = await chat.save();
    
    expect(savedChat.isActive).toBe(false);
    expect(Array.isArray(savedChat.participants)).toBe(true);
  });

  it('should throw validation error if required fields are missing', async () => {
    // Missing chatId
    const invalidChat = new chatModel({
      participants: ['user1'],
    });
    
    await expect(invalidChat.save()).rejects.toThrow();
  });

  it('should throw validation error if participants is empty', async () => {
    const invalidChat = new chatModel({
      chatId: 'empty-participants',
      participants: [],
    });
    
    await expect(invalidChat.save()).resolves.toBeDefined();
  });
}); 