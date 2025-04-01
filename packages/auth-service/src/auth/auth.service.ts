import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';
import { ObjectId } from 'mongodb';
import { LoginResponseDto } from '@chatti/shared-types';

interface UserData {
  _id?: ObjectId;
  name: string;
  avatar: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly guestService: GuestService,
  ) {}

  /**
   * Generate a guest login token
   * If name is not provided, generate a random name
   */
  async login(name?: string): Promise<LoginResponseDto> {
    const userName = name || this.guestService.generateRandomName();
    const avatar = this.guestService.generateAvatar(userName);

    // Create user document
    const userData: UserData = {
      name: userName,
      avatar,
      createdAt: new Date(),
    };

    // Store in database
    const result = await this.dbService.users.insertOne(userData);

    // Generate JWT token
    const token = this.jwtService.generateToken({
      userId: result.insertedId.toString(),
      name: userName,
    });

    return {
      name: userName,
      avatar,
      token,
    };
  }
}
