import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for creating a new chat room
 */
export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
} 