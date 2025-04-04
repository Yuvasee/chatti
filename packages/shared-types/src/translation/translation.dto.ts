import { IsNotEmpty, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for translation data
 */
export class TranslationDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  originalText!: string;

  @IsString()
  @IsNotEmpty()
  translatedText!: string;

  @IsString()
  @IsNotEmpty()
  sourceLanguage!: string;

  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;
} 