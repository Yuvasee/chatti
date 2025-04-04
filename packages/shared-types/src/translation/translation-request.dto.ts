import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for translation requests
 */
export class TranslationRequestDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  originalText!: string;

  @IsString()
  @IsNotEmpty()
  sourceLanguage!: string;

  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;
} 