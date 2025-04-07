import ChatService from './ChatService';
import { SOCKET_EVENTS } from '../constants/chat-events';

// Storage keys
const LANGUAGE_STORAGE_KEY = 'chatti_language_preference';
const PENDING_TRANSLATIONS_KEY = 'chatti_pending_translations';

/**
 * Translation Service for handling language preferences and translations
 */
export class TranslationService {
  // Local cache for already translated messages
  private static translationCache: Record<string, Record<string, string>> = {};
  
  // User's current preferred language
  private static currentLanguage: string = TranslationService.getStoredLanguage() || 'en';

  // Cache of messages pending translation
  private static pendingTranslations: Record<string, Set<string>> = TranslationService.getStoredPendingTranslations();

  // Static initialization to ensure proper loading
  static {
    // Ensure pending translations are loaded on initialization
    this.pendingTranslations = this.getStoredPendingTranslations();
    console.log('TranslationService initialized with pending translations:', 
      Object.keys(this.pendingTranslations).length);
  }

  /**
   * Get the stored pending translations from localStorage
   * @returns The stored pending translations
   */
  private static getStoredPendingTranslations(): Record<string, Set<string>> {
    try {
      const pendingData = localStorage.getItem(PENDING_TRANSLATIONS_KEY);
      console.log('Retrieved pending translations from localStorage:', pendingData);
      
      if (!pendingData) return {};
      
      // Convert the stored array format back to Set
      const pending: Record<string, string[]> = JSON.parse(pendingData);
      const result: Record<string, Set<string>> = {};
      
      // Convert arrays back to Sets
      Object.entries(pending).forEach(([messageId, languages]) => {
        if (languages && languages.length > 0) {
          result[messageId] = new Set(languages);
        }
      });
      
      console.log('Parsed pending translations:', 
        Object.keys(result).length + ' messages with pending translations');
      return result;
    } catch (error) {
      console.error('Error retrieving pending translations:', error);
      return {};
    }
  }

  /**
   * Store the pending translations in localStorage
   */
  private static storePendingTranslations(): void {
    try {
      // Convert Sets to arrays for JSON serialization
      const pendingData: Record<string, string[]> = {};
      
      Object.entries(this.pendingTranslations).forEach(([messageId, languages]) => {
        if (languages.size > 0) {
          pendingData[messageId] = Array.from(languages);
        }
      });
      
      localStorage.setItem(PENDING_TRANSLATIONS_KEY, JSON.stringify(pendingData));
    } catch (error) {
      console.error('Error storing pending translations:', error);
    }
  }

  /**
   * Get the stored language preference from localStorage
   * @returns The stored language preference or null if not set
   */
  private static getStoredLanguage(): string | null {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  }

  /**
   * Store the language preference in localStorage
   * @param language The language code to store
   */
  private static setStoredLanguage(language: string): void {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  /**
   * Mark a message as having a pending translation
   * @param messageId The message ID
   * @param language The language code
   */
  public static addPendingTranslation(messageId: string, language: string): void {
    if (!this.pendingTranslations[messageId]) {
      this.pendingTranslations[messageId] = new Set();
    }
    
    this.pendingTranslations[messageId].add(language);
    console.log(`Added pending translation for message ${messageId} to ${language}`);
    
    this.storePendingTranslations();
  }

  /**
   * Remove a pending translation
   * @param messageId The message ID
   * @param language The language code
   */
  public static removePendingTranslation(messageId: string, language: string): void {
    if (this.pendingTranslations[messageId]) {
      this.pendingTranslations[messageId].delete(language);
      
      // Remove the message entry if no languages are pending
      if (this.pendingTranslations[messageId].size === 0) {
        delete this.pendingTranslations[messageId];
      }
      
      this.storePendingTranslations();
    }
  }

  /**
   * Check if a translation is pending
   * @param messageId The message ID
   * @param language The language code
   * @returns True if the translation is pending
   */
  public static isPendingTranslation(messageId: string, language: string): boolean {
    // Force re-read from localStorage to ensure we have latest data
    if (Object.keys(this.pendingTranslations).length === 0) {
      this.pendingTranslations = this.getStoredPendingTranslations();
    }
    return !!this.pendingTranslations[messageId]?.has(language);
  }

  /**
   * Get all pending translations
   * @returns Record of message IDs to Sets of language codes
   */
  public static getPendingTranslations(): Record<string, Set<string>> {
    return this.pendingTranslations;
  }

  /**
   * Set the user's preferred language and notify the server
   * @param language ISO language code (e.g., 'en', 'es', 'fr')
   */
  public static setLanguagePreference(language: string): void {
    this.currentLanguage = language;
    
    // Store in localStorage for persistence across page refreshes
    this.setStoredLanguage(language);
    
    // Notify the server about language change if connected
    if (ChatService.isConnected()) {
      ChatService.emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { language });
    }
  }

  /**
   * Get the user's current language preference
   * @returns The current language ISO code
   */
  public static getLanguagePreference(): string {
    return this.currentLanguage;
  }

  /**
   * Add a translation to the cache
   * @param messageId The message ID
   * @param language The language code
   * @param translatedText The translated text
   */
  public static cacheTranslation(messageId: string, language: string, translatedText: string): void {
    if (!this.translationCache[messageId]) {
      this.translationCache[messageId] = {};
    }
    this.translationCache[messageId][language] = translatedText;
    
    // Remove from pending translations since we now have it
    this.removePendingTranslation(messageId, language);
  }

  /**
   * Get a cached translation if available
   * @param messageId The message ID
   * @param language The language code
   * @returns The cached translation or null if not available
   */
  public static getCachedTranslation(messageId: string, language: string): string | null {
    return this.translationCache[messageId]?.[language] || null;
  }

  /**
   * Check if a translation is cached
   * @param messageId The message ID
   * @param language The language code
   * @returns True if the translation is cached
   */
  public static hasTranslation(messageId: string, language: string): boolean {
    return !!this.translationCache[messageId]?.[language];
  }

  /**
   * Clear the translation cache
   */
  public static clearCache(): void {
    this.translationCache = {};
  }

  /**
   * Import translations from message history
   * @param translations Array of translation responses from server
   */
  public static importTranslations(translations: Record<string, Record<string, string>> | undefined): void {
    if (!translations) return;
    
    // For each message, add its translations to the cache
    Object.entries(translations).forEach(([messageId, langMap]) => {
      if (!this.translationCache[messageId]) {
        this.translationCache[messageId] = {};
      }
      
      // Merge the translations for this message
      this.translationCache[messageId] = {
        ...this.translationCache[messageId],
        ...langMap
      };
    });
  }
} 