import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for joining a chat room
 * 
 * Note: userId and username are now extracted from JWT token
 * so they don't need to be included in the request payload
 */
export class JoinChatDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;
} 