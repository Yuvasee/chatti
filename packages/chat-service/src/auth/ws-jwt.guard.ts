import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from './jwt.service';
import { Socket } from 'socket.io';
import { AppLogger, AuthenticationError, ErrorCode } from '@chatti/shared-types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly logger: AppLogger
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // For WebSockets, the client is in the switchToWs() context
    const client: Socket = context.switchToWs().getClient();
    
    // Extract token from handshake auth
    const token = this.extractToken(client);

    try {
      // Verify the token
      const payload = this.jwtService.verifyToken(token);
      
      // Store user information in the socket data for later use
      client.data.userId = payload.userId;
      client.data.username = payload.username;
      
      this.logger.debug(`Authenticated WebSocket connection for user ${payload.username} (${payload.userId})`);
      return true;
    } catch (error) {
      this.logger.error(`WsJwtGuard: Authentication failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Disconnect the client with auth error
      client.emit('error', { 
        message: 'Authentication failed', 
        code: error instanceof AuthenticationError ? error.code : ErrorCode.UNAUTHORIZED
      });
      client.disconnect(true);
      
      return false;
    }
  }

  private extractToken(client: Socket): string {
    // Token should be in handshake auth object
    const auth = client.handshake?.auth;
    
    if (!auth || !auth.token) {
      this.logger.warn(`WsJwtGuard: No token provided in connection from ${client.id}`);
      throw new AuthenticationError('Authentication token is missing', ErrorCode.UNAUTHORIZED);
    }
    
    return auth.token;
  }
} 