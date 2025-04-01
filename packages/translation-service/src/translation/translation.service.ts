import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { DatabaseService } from '../database/database.service';

// Define response type based on LangChain output
interface AIMessageLike {
  content: string | object;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private model!: OpenAI;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not defined in environment variables');
      throw new Error('OPENAI_API_KEY is required');
    }

    this.model = new OpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1, // Low temperature for more accurate translations
    });
  }

  /**
   * Translates text from source language to target language using OpenAI
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    try {
      const promptTemplate = new PromptTemplate({
        template:
          'Translate the following text from {source_language} to {target_language}. ' +
          'Maintain the original meaning, tone, and formatting as closely as possible. ' +
          'Focus on natural translation that sounds native in the target language:\n\n{text}',
        inputVariables: ['source_language', 'target_language', 'text'],
      });

      const chain = RunnableSequence.from([promptTemplate, this.model]);

      const response = await chain.invoke({
        source_language: sourceLanguage,
        target_language: targetLanguage,
        text: text,
      });

      // Extract the translated text from the response
      let translatedText: string;

      if (typeof response === 'string') {
        translatedText = response.trim();
      } else {
        // Assume AI message-like response with content property
        const messageResponse = response as AIMessageLike;
        translatedText = String(messageResponse.content).trim();
      }

      return translatedText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Translation error: ${errorMessage}`, errorStack);
      throw new Error(`Failed to translate text: ${errorMessage}`);
    }
  }

  /**
   * Process a translation job and store the result
   */
  async processTranslation(
    messageId: string,
    originalText: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<void> {
    // Skip translation if languages are the same
    if (sourceLanguage === targetLanguage) {
      await this.databaseService.saveTranslation({
        messageId,
        originalText,
        translatedText: originalText,
        sourceLanguage,
        targetLanguage,
      });
      return;
    }

    try {
      const existingTranslation = await this.databaseService.getTranslation(
        messageId,
        targetLanguage,
      );

      // If translation already exists, skip
      if (existingTranslation) {
        this.logger.log(`Translation already exists for messageId: ${messageId}`);
        return;
      }

      // Translate the text
      const translatedText = await this.translateText(originalText, sourceLanguage, targetLanguage);

      // Save the translation to the database
      await this.databaseService.saveTranslation({
        messageId,
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage,
      });

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
}
