import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';
import { LoginResponseDto } from '@chatti/shared-types';
import mongoose from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private guestService: GuestService,
  ) {}

  /**
   * Generate a guest login token
   * If name is not provided, generate a random name
   */
  async login(name?: string): Promise<LoginResponseDto> {
    const userName = name || this.guestService.generateRandomName();
    const avatar = this.guestService.generateAvatar(userName);

    const newUser = new this.userModel({
      name: userName,
      avatar,
    });

    const savedUser = await newUser.save();
    const userId = (savedUser._id as mongoose.Types.ObjectId).toString();
    const token = this.jwtService.generateToken({ userId, name: userName });

    return {
      name: userName,
      avatar,
      token,
    };
  }

  async loginAsGuest(): Promise<LoginResponseDto> {
    const name = this.guestService.generateRandomName();
    const avatar = this.guestService.generateAvatar(name);

    const newUser = new this.userModel({
      name,
      avatar,
    });

    const savedUser = await newUser.save();
    const userId = (savedUser._id as mongoose.Types.ObjectId).toString();
    const token = this.jwtService.generateToken({ userId, name });

    return {
      token,
      name,
      avatar,
    };
  }
}
