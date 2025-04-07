import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Translation, TranslationDocument } from '../schemas/translation.schema';
import { QueueService } from '../queue/queue.service';
import { 
  TranslationRequestDto, 
  AppLogger,
  ErrorCode,
  AppError,
  API_ENDPOINTS,
  TranslationNotificationDto,
  getErrorMessage 
} from '@chatti/shared-types';
import OpenAI from 'openai';
import axios from 'axios';

@Injectable()
export class TranslationService {
  private openai: OpenAI;
  private chatServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
    @InjectModel(Translation.name) private translationModel: Model<TranslationDocument>,
    private readonly logger: AppLogger
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not defined in environment');
      throw new AppError(
        'OPENAI_API_KEY is not defined in environment',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }

    this.openai = new OpenAI({
      apiKey,
    });
    
    // Get chat service URL from config
    this.chatServiceUrl = this.configService.get<string>('chatService.url') || 'http://localhost:4001';
    this.logger.log(`Chat service URL configured as: ${this.chatServiceUrl}`);
  }

  /**
   * Translate text using OpenAI
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    try {
      if (!text) {
        this.logger.debug('Empty text provided for translation, returning empty string');
        return '';
      }

      this.logger.log(`Translating text from ${sourceLanguage} to ${targetLanguage}`);
      
      // Skip translation if languages are the same
      if (sourceLanguage === targetLanguage) {
        this.logger.debug('Source and target languages are the same, skipping translation');
        return text;
      }

      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
          Maintain the same tone, sentiment, and meaning. Return only the translated text without any additional
          explanations or quotes.
          
          Text to translate: ${text}`;
      
      this.logger.debug(`Sending translation request to OpenAI`);
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
      });

      const translatedText = completion.choices[0]?.message?.content?.trim() || '';
      this.logger.debug(`Received translation response, translated text length: ${translatedText.length}`);
      
      return translatedText;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Translation error: ${errorMessage}`, 
        error instanceof Error ? error.stack : undefined
      );
      
      throw new AppError(
        `Translation failed: ${errorMessage}`, 
        ErrorCode.TRANSLATION_ERROR
      );
    }
  }

  /**
   * Process a translation job and store the result
   */
  async processTranslation(job: TranslationRequestDto): Promise<void> {
    try {
      const { messageId, originalText, sourceLanguage, targetLanguage, chatId } = job;
      this.logger.log(`Processing translation for message ${messageId} from ${sourceLanguage} to ${targetLanguage}`);
      
      // Skip translation if languages are the same
      if (sourceLanguage === targetLanguage) {
        this.logger.debug(`Source and target languages are the same (${sourceLanguage}), storing original text`);
        const newTranslation = new this.translationModel({
          messageId,
          originalText,
          translatedText: originalText,
          sourceLanguage,
          targetLanguage,
        });
        await newTranslation.save();
        this.logger.log(`Stored original text as translation for message ${messageId}`);
        
        // Notify if we have a chatId
        if (chatId) {
          // Notify about the translation even though it's just a copy
          await this.notifyTranslationComplete(messageId, chatId, targetLanguage, originalText);
        } else {
          this.logger.warn(`No chatId found in job data for message ${messageId}`);
        }
        
        return;
      }

      // Check if translation already exists
      const existingTranslation = await this.translationModel.findOne({
        messageId,
        targetLanguage,
      }).exec();

      // If translation already exists, skip
      if (existingTranslation) {
        this.logger.log(`Translation already exists for messageId: ${messageId} to ${targetLanguage}`);
        
        // Notify if we have a chatId
        if (chatId) {
          // Notify about the existing translation
          await this.notifyTranslationComplete(messageId, chatId, targetLanguage, existingTranslation.translatedText);
        } else {
          this.logger.warn(`No chatId found in job data for message ${messageId}`);
        }
        
        return;
      }

      // Translate the text
      this.logger.debug(`Translating text for message ${messageId}`);
      const translatedText = await this.translateText(originalText, sourceLanguage, targetLanguage);

      // Save the translation to the database
      const newTranslation = new this.translationModel({
        messageId,
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage,
      });
      
      const savedTranslation = await newTranslation.save();
      
      if (!savedTranslation) {
        throw new AppError(
          `Failed to save translation for message ${messageId}`,
          ErrorCode.DATABASE_ERROR
        );
      }

      this.logger.log(
        `Successfully translated message ${messageId} from ${sourceLanguage} to ${targetLanguage}`
      );
      
      // Notify if we have a chatId
      if (chatId) {
        // Notify the chat service about the completed translation
        await this.notifyTranslationComplete(messageId, chatId, targetLanguage, translatedText);
      } else {
        this.logger.warn(`No chatId found in job data for message ${messageId}`);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to process translation for messageId ${job.messageId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      
      // Convert any error to an AppError for consistent handling
      if (!(error instanceof AppError)) {
        throw new AppError(
          `Translation processing failed: ${errorMessage}`,
          ErrorCode.TRANSLATION_ERROR
        );
      }
      
      throw error;
    }
  }

  /**
   * Notify the chat service about a completed translation
   */
  private async notifyTranslationComplete(
    messageId: string,
    chatId: string,
    language: string,
    translatedContent: string
  ): Promise<void> {
    try {
      this.logger.log(`Notifying chat service about completed translation for message ${messageId} to ${language}`);
      
      const notificationEndpoint = `${this.chatServiceUrl}${API_ENDPOINTS.CHAT.TRANSLATIONS_NOTIFY}`;
      
      const notification: TranslationNotificationDto = {
        messageId,
        chatId,
        language,
        translatedContent
      };
      
      // Send notification to chat service
      await axios.post(notificationEndpoint, notification);
      
      this.logger.log(`Successfully notified chat service about translation for message ${messageId}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to notify chat service about translation for message ${messageId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      // Don't throw an error here to avoid failing the whole job
      // Just log the error and continue
    }
  }

  /**
   * Get translations for a message
   */
  async getTranslations(messageId: string, targetLanguage: string): Promise<Translation | null> {
    try {
      this.logger.debug(`Getting ${targetLanguage} translation for message ${messageId}`);
      
      const translation = await this.translationModel.findOne({
        messageId,
        targetLanguage,
      }).exec();
      
      if (!translation) {
        this.logger.debug(`No ${targetLanguage} translation found for message ${messageId}`);
      } else {
        this.logger.debug(`Found ${targetLanguage} translation for message ${messageId}`);
      }
      
      return translation;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Error getting translation for message ${messageId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new AppError(
        `Failed to get translation: ${errorMessage}`,
        ErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Get translations for multiple messages
   */
  async getTranslationsForMessages(messageIds: string[], targetLanguage: string): Promise<Translation[]> {
    try {
      this.logger.debug(`Getting ${targetLanguage} translations for ${messageIds.length} messages`);
      
      const translations = await this.translationModel.find({
        messageId: { $in: messageIds },
        targetLanguage,
      }).exec();
      
      this.logger.debug(`Found ${translations.length} translations out of ${messageIds.length} messages`);
      return translations;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Error getting translations for multiple messages: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new AppError(
        `Failed to get translations: ${errorMessage}`,
        ErrorCode.DATABASE_ERROR
      );
    }
  }
}
