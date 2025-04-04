import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Connection, connect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, UserSchema } from './user.schema';

describe('User Schema', () => {
  let userModel: Model<User>;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
    }).compile();

    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  it('should create a user with valid data', async () => {
    const userData = {
      name: 'Test User',
      avatar: 'avatar-url',
    };
    
    const user = new userModel(userData);
    const savedUser = await user.save();
    
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.avatar).toBe(userData.avatar);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should throw validation error if required fields are missing', async () => {
    const invalidUser = new userModel({});
    
    await expect(invalidUser.save()).rejects.toThrow();
  });

  it('should throw validation error if name is missing', async () => {
    const invalidUser = new userModel({
      avatar: 'avatar-url'
    });
    
    await expect(invalidUser.save()).rejects.toThrow();
  });

  it('should throw validation error if avatar is missing', async () => {
    const invalidUser = new userModel({
      name: 'Test User'
    });
    
    await expect(invalidUser.save()).rejects.toThrow();
  });
}); 