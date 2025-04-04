import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';
import { 
  LoginResponseDto, 
  AppLogger, 
  AppError, 
  ErrorCode,
  getErrorMessage
} from '@chatti/shared-types';
import mongoose from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private guestService: GuestService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Generate a guest login token
   * If name is not provided, generate a random name
   */
  async login(name?: string): Promise<LoginResponseDto> {
    try {
      this.logger.log(`Processing login request${name ? ` for user ${name}` : ''}`);
      
      const userName = name || this.guestService.generateRandomName();
      const avatar = this.guestService.generateAvatar(userName);

      const newUser = new this.userModel({
        name: userName,
        avatar,
      });

      const savedUser = await newUser.save();
      if (!savedUser) {
        throw new AppError(
          'Failed to create user',
          ErrorCode.DATABASE_ERROR,
        );
      }

      const userId = (savedUser._id as mongoose.Types.ObjectId).toString();
      const token = this.jwtService.generateToken({ userId, username: userName });

      this.logger.log(`User successfully logged in: ${userId}`);
      
      return {
        name: userName,
        avatar,
        token,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in login: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async loginAsGuest(): Promise<LoginResponseDto> {
    try {
      this.logger.log('Processing guest login request');
      
      const name = this.guestService.generateRandomName();
      const avatar = this.guestService.generateAvatar(name);

      const newUser = new this.userModel({
        name,
        avatar,
      });

      const savedUser = await newUser.save();
      if (!savedUser) {
        throw new AppError(
          'Failed to create guest user',
          ErrorCode.DATABASE_ERROR,
        );
      }

      const userId = (savedUser._id as mongoose.Types.ObjectId).toString();
      const token = this.jwtService.generateToken({ userId, username: name });

      this.logger.log(`Guest user successfully logged in: ${userId}`);
      
      return {
        token,
        name,
        avatar,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in loginAsGuest: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
