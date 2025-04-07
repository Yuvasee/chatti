import { Injectable } from '@nestjs/common';
import { verify, Secret, VerifyOptions } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { 
  TokenPayloadDto, 
  AppLogger, 
  AuthenticationError, 
  ErrorCode 
} from '@chatti/shared-types';

@Injectable()
export class JwtService {
  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger
  ) {}

  verifyToken(token: string): TokenPayloadDto {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'change_me_in_production';
      const decoded = verify(token, secret as Secret, {} as VerifyOptions) as unknown as TokenPayloadDto;
      
      this.logger.debug(`Verified token for user: ${decoded.userId}`);
      return decoded;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token verification failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      
      // Determine more specific error type based on the error
      if (errorMessage.includes('expired')) {
        throw new AuthenticationError('Token has expired', ErrorCode.TOKEN_EXPIRED);
      }
      
      throw new AuthenticationError('Invalid token', ErrorCode.INVALID_TOKEN);
    }
  }
} 