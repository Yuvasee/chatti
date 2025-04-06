import { IsNotEmpty, IsString, IsOptional, IsDate, IsObject } from 'class-validator';

/**
 * DTO for sending a chat message
 */
export class MessageDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  language!: string;
}

/**
 * DTO for message responses that includes server-added fields
 */
export class MessageResponseDto extends MessageDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsDate()
  @IsNotEmpty()
  createdAt!: Date;

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;
}

/**
 * DTO for creating a message in the database
 */
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
} 