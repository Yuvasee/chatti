import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '@chatti/shared-types';

@Module({
  imports: [
    ConfigModule,
    LoggingModule
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class AuthModule {} 