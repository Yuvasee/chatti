import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../common/database.service';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';
import { ObjectId } from 'mongodb';
import { LoginResponseDto, TokenPayloadDto } from '@chatti/shared-types';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';

// Mock implementations
const mockUserModel = {
  create: jest.fn().mockImplementation((userData) => ({
    _id: new ObjectId(),
    ...userData,
  })),
};

const mockJwtService = {
  generateToken: jest.fn().mockImplementation((payload: TokenPayloadDto) => 'mock-token'),
};

const mockGuestService = {
  generateRandomName: jest.fn().mockReturnValue('RandomName123'),
  generateAvatar: jest.fn().mockReturnValue('https://avatar-url.com'),
};

const mockAppLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  setContext: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: 'AppLogger', useValue: mockAppLogger },
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

      expect(result).toBeInstanceOf(Object);
      expect(result).toHaveProperty('name', 'TestUser');
      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('token');

      // Check if result matches LoginResponseDto structure
      const loginResponse = result as LoginResponseDto;
      expect(loginResponse.name).toBe('TestUser');
      expect(loginResponse.avatar).toBeDefined();
      expect(loginResponse.token).toBe('mock-token');

      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockJwtService.generateToken).toHaveBeenCalled();
    });

    it('should generate a random name when no name is provided', async () => {
      const result = await service.login();

      expect(mockGuestService.generateRandomName).toHaveBeenCalled();
      expect(result).toHaveProperty('name', 'RandomName123');
      expect(result).toHaveProperty('avatar');
      expect(result).toHaveProperty('token');
      
      // Check if result matches LoginResponseDto structure
      const loginResponse = result as LoginResponseDto;
      expect(loginResponse.name).toBe('RandomName123');
      expect(loginResponse.avatar).toBe('https://avatar-url.com');
      expect(loginResponse.token).toBe('mock-token');
    });
  });
});
