import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Translation, TranslationDocument } from '../schemas/translation.schema';
import { QueueService } from '../queue/queue.service';
import { TranslationRequestDto, TranslationResponseDto } from '@chatti/shared-types';
import OpenAI from 'openai';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
    @InjectModel(Translation.name) private translationModel: Model<TranslationDocument>
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Queue a message for translation
   */
  async queueTranslation(
    messageId: string,
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<void> {
    const translationJob: TranslationRequestDto = {
      messageId,
      originalText: text,
      sourceLanguage,
      targetLanguage,
    };
    
    await this.queueService.addTranslationJob(translationJob);

    this.logger.log(`Translation queued for message ${messageId} to ${targetLanguage}`);
  }

  /**
   * Translate text using OpenAI
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    if (!text) {
      return '';
    }

    try {
      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
          Maintain the same tone, sentiment, and meaning. Return only the translated text without any additional
          explanations or quotes.
          
          Text to translate: ${text}`;
      
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Translation error: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Process a translation job and store the result
   */
  async processTranslation(job: TranslationRequestDto): Promise<void> {
    const { messageId, originalText, sourceLanguage, targetLanguage } = job;
    
    // Skip translation if languages are the same
    if (sourceLanguage === targetLanguage) {
      const newTranslation = new this.translationModel({
        messageId,
        originalText,
        translatedText: originalText,
        sourceLanguage,
        targetLanguage,
      });
      await newTranslation.save();
      return;
    }

    try {
      const existingTranslation = await this.translationModel.findOne({
        messageId,
        targetLanguage,
      }).exec();

      // If translation already exists, skip
      if (existingTranslation) {
        this.logger.log(`Translation already exists for messageId: ${messageId}`);
        return;
      }

      // Translate the text
      const translatedText = await this.translateText(originalText, sourceLanguage, targetLanguage);

      // Save the translation to the database
      const newTranslation = new this.translationModel({
        messageId,
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage,
      });
      await newTranslation.save();

      this.logger.log(
        `Successfully translated message ${messageId} from ${sourceLanguage} to ${targetLanguage}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to process translation for messageId ${messageId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Get translations for a message
   */
  async getTranslations(messageId: string, targetLanguage: string): Promise<Translation | null> {
    return this.translationModel.findOne({
      messageId,
      targetLanguage,
    }).exec();
  }

  /**
   * Get translations for multiple messages
   */
  async getTranslationsForMessages(messageIds: string[], targetLanguage: string): Promise<Translation[]> {
    return this.translationModel.find({
      messageId: { $in: messageIds },
      targetLanguage,
    }).exec();
  }
}
