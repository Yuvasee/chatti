import { Injectable } from '@nestjs/common';
import { sign, verify, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
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

  generateToken(payload: TokenPayloadDto): string {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'default-secret-key-for-development';
      const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
      
      this.logger.debug(`Generating token for user: ${payload.userId}`);
      return sign(payload, secret as Secret, { expiresIn } as SignOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate token: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new AuthenticationError('Failed to generate authentication token');
    }
  }

  verifyToken(token: string): TokenPayloadDto {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'default-secret-key-for-development';
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
