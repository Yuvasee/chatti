import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for translation notification between services
 */
export class TranslationNotificationDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsString()
  @IsNotEmpty()
  translatedContent!: string;
} 