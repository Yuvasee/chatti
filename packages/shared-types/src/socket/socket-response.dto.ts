/**
 * Base DTO for Socket.IO acknowledgment responses
 */
export class SocketResponseDto<T = any> {
  success!: boolean;
  message?: string;
  data?: T;
  code?: string;
}
