import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for creating a new chat room
 * 
 * Note: userId is now extracted from JWT token
 * so it doesn't need to be included in the request payload
 */
export class CreateChatDto {
  // No fields required as the user ID is taken from the JWT token
} 