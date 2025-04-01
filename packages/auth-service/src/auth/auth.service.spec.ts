import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../common/database.service';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';
import { ObjectId } from 'mongodb';

// Mock implementations
const mockDatabaseService = {
  users: {
    insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
  },
};

const mockJwtService = {
  generateToken: jest.fn().mockReturnValue('mock-token'),
};

const mockGuestService = {
  generateRandomName: jest.fn().mockReturnValue('RandomName123'),
  generateAvatar: jest.fn().mockReturnValue('https://avatar-url.com'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: GuestService, useValue: mockGuestService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return user data with a token when a name is provided', async () => {
      const result = await service.login('TestUser');

      expect(result).toHaveProperty('name', 'TestUser');
      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('token');

      expect(mockDatabaseService.users.insertOne).toHaveBeenCalled();
      expect(mockJwtService.generateToken).toHaveBeenCalled();
    });

    it('should generate a random name when no name is provided', async () => {
      const result = await service.login();

      expect(mockGuestService.generateRandomName).toHaveBeenCalled();
      expect(result).toHaveProperty('name', 'RandomName123');
      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('token');
    });
  });
});
