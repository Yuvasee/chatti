import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../common/database.service';
import { JwtService } from './jwt.service';
import { GuestService } from './guest.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService, JwtService, GuestService],
})
export class AuthModule {}
