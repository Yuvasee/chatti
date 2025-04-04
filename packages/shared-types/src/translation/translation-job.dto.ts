import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for translation job requests
 */
export class TranslationJobDto {
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