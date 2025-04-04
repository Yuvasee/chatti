import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for joining a chat room
 */
export class JoinChatDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;
} 