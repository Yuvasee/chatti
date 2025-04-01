import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  name: string;
}

@Injectable()
export class JwtService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-key-for-development';
  }

  generateToken(payload: TokenPayload): string {
    return sign(payload, this.secret, { expiresIn: '7d' });
  }

  verifyToken(token: string): TokenPayload {
    try {
      return verify(token, this.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
