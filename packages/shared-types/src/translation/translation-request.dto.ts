import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * DTO for translation requests
 * This is the single DTO used for all translation jobs
 */
export class TranslationRequestDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  sourceLanguage!: string;

  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;

  @IsString()
  @IsNotEmpty()
  originalText!: string;
  
  @IsString()
  @IsOptional()
  chatId?: string;
} 