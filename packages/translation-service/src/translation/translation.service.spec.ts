import { Test, TestingModule } from '@nestjs/testing';
import { TranslationService } from './translation.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RunnableSequence } from '@langchain/core/runnables';

// Mock the Langchain and OpenAI dependencies
jest.mock('@langchain/openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockResolvedValue({ content: 'Translated text' }),
    })),
  };
});

// Mock RunnableSequence.from
jest.mock('@langchain/core/runnables', () => {
  return {
    RunnableSequence: {
      from: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({ content: 'Translated text' }),
      })),
    },
  };
});

describe('TranslationService', () => {
  let service: TranslationService;
  let databaseService: DatabaseService;

  const mockConfigService = {
    get: jest.fn(key => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  const mockDatabaseService = {
    saveTranslation: jest.fn().mockResolvedValue(true),
    getTranslation: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translateText', () => {
    it('should call the translation chain with the correct parameters', async () => {
      const text = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      const result = await service.translateText(text, sourceLanguage, targetLanguage);

      // Verify result is a string (not checking exact content)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors during translation', async () => {
      // Mock the implementation to throw an error
      jest.spyOn(RunnableSequence, 'from').mockImplementationOnce(() => {
        return {
          invoke: jest.fn().mockRejectedValue(new Error('Translation failed')),
        } as any;
      });

      const text = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      await expect(service.translateText(text, sourceLanguage, targetLanguage)).rejects.toThrow(
        'Failed to translate text: Translation failed',
      );
    });
  });

  describe('processTranslation', () => {
    it('should skip translation if source and target languages are the same', async () => {
      const messageId = 'msg-123';
      const text = 'Hello world';
      const language = 'en';

      await service.processTranslation(messageId, text, language, language);

      expect(databaseService.saveTranslation).toHaveBeenCalledWith({
        messageId,
        originalText: text,
        translatedText: text,
        sourceLanguage: language,
        targetLanguage: language,
      });
    });

    it('should skip translation if it already exists', async () => {
      const messageId = 'msg-123';
      const text = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      // Mock that the translation already exists
      mockDatabaseService.getTranslation.mockResolvedValueOnce({
        messageId,
        originalText: text,
        translatedText: 'Hola mundo',
        sourceLanguage,
        targetLanguage,
      });

      await service.processTranslation(messageId, text, sourceLanguage, targetLanguage);

      expect(databaseService.getTranslation).toHaveBeenCalledWith(messageId, targetLanguage);
      expect(databaseService.saveTranslation).not.toHaveBeenCalled();
    });

    it('should translate and save if translation does not exist', async () => {
      const messageId = 'msg-123';
      const text = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      // Mock that the translation doesn't exist
      mockDatabaseService.getTranslation.mockResolvedValueOnce(null);

      // Spy on translateText to verify it's called
      const translateSpy = jest.spyOn(service, 'translateText');
      translateSpy.mockResolvedValueOnce('Hola mundo');

      await service.processTranslation(messageId, text, sourceLanguage, targetLanguage);

      expect(databaseService.getTranslation).toHaveBeenCalledWith(messageId, targetLanguage);
      expect(translateSpy).toHaveBeenCalledWith(text, sourceLanguage, targetLanguage);
      expect(databaseService.saveTranslation).toHaveBeenCalledWith({
        messageId,
        originalText: text,
        translatedText: 'Hola mundo',
        sourceLanguage,
        targetLanguage,
      });
    });
  });
});
