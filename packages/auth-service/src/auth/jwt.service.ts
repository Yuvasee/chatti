import { Injectable } from '@nestjs/common';
import { sign, verify, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { TokenPayloadDto } from '@chatti/shared-types';

@Injectable()
export class JwtService {
  constructor(private configService: ConfigService) {}

  generateToken(payload: TokenPayloadDto): string {
    const secret = this.configService.get<string>('jwt.secret') || 'default-secret-key-for-development';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    return sign(payload, secret as Secret, { expiresIn } as SignOptions);
  }

  verifyToken(token: string): TokenPayloadDto {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'default-secret-key-for-development';
      return verify(token, secret as Secret, {} as VerifyOptions) as unknown as TokenPayloadDto;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
