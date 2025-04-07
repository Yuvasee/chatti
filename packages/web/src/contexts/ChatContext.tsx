import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ChatService, AuthService, TranslationService } from '../api';
import { MessageResponseDto } from '@chatti/shared-types';
import { SOCKET_EVENTS } from '../constants/chat-events';

// Extended Message type with frontend properties - uses the response DTO which already has
// id, createdAt, and translations fields from the server
export interface Message extends MessageResponseDto {
  // Any additional frontend-specific properties can be added here
}

// User presence type
export interface UserPresence {
  userId: string;
  username: string;
  isTyping: boolean;
  lastActive?: Date;
}

// Translation completion type based on shared DTOs
export interface TranslationCompleteEvent {
  messageId: string;
  language: string;
  translatedContent: string;
}

// Chat context state
interface ChatContextState {
  isConnected: boolean;
  currentChatId: string | null;
  messages: Message[];
  activeUsers: UserPresence[];
  isLoading: boolean;
  error: Error | null;
  currentLanguage: string;
  availableLanguages: {code: string, name: string}[];
  connectToChat: () => Promise<void>;
  disconnectFromChat: () => void;
  createChat: () => Promise<string>;
  joinChat: (chatId: string) => Promise<void>;
  leaveChat: () => Promise<void>;
  sendMessage: (content: string, language: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  clearError: () => void;
  setLanguagePreference: (language: string) => void;
}

// Default context state
const defaultState: ChatContextState = {
  isConnected: false,
  currentChatId: null,
  messages: [],
  activeUsers: [],
  isLoading: false,
  error: null,
  currentLanguage: TranslationService.getLanguagePreference(),
  availableLanguages: [
    { code: 'he', name: 'Hebrew' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Russian' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ],
  connectToChat: async () => {},
  disconnectFromChat: () => {},
  createChat: async () => '',
  joinChat: async () => {},
  leaveChat: async () => {},
  sendMessage: async () => {},
  startTyping: () => {},
  stopTyping: () => {},
  clearError: () => {},
  setLanguagePreference: () => {}
};

// Create the context
const ChatContext = createContext<ChatContextState>(defaultState);

// Hook for easy context consumption
export const useChat = () => useContext(ChatContext);

// Props for the provider
interface ChatProviderProps {
  children: ReactNode;
}

// Provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(
    TranslationService.getLanguagePreference()
  );
  const [availableLanguages] = useState(defaultState.availableLanguages);
  
  useEffect(() => {
    console.log('messages', messages)
  }, [messages]);
  
  // Reference to track if we already processed the join event
  const joinedChatRef = useRef<string | null>(null);

  // Set up event listeners when component mounts
  useEffect(() => {
    // Set up connection listeners once
    const setupEventListeners = () => {
      // Set up connection listeners
      ChatService.on(SOCKET_EVENTS.CONNECT, handleConnect);
      ChatService.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      ChatService.on(SOCKET_EVENTS.CONNECT_ERROR, handleError);
      
      // Set up message listeners
      ChatService.on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      ChatService.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      ChatService.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      ChatService.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      ChatService.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      ChatService.on(SOCKET_EVENTS.TRANSLATION_COMPLETE, handleTranslationComplete);
      ChatService.on(SOCKET_EVENTS.ERROR, handleError);
    };
    
    setupEventListeners();

    // Clean up listeners when component unmounts
    return () => {
      // Remove connection listeners
      ChatService.off(SOCKET_EVENTS.CONNECT, handleConnect);
      ChatService.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      ChatService.off(SOCKET_EVENTS.CONNECT_ERROR, handleError);
      
      // Remove message listeners
      ChatService.off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      ChatService.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      ChatService.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      ChatService.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      ChatService.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      ChatService.off(SOCKET_EVENTS.TRANSLATION_COMPLETE, handleTranslationComplete);
      ChatService.off(SOCKET_EVENTS.ERROR, handleError);
      
      // Disconnect and reset the joined chat reference
      ChatService.disconnect();
      joinedChatRef.current = null;
    };
  }, []); // Empty dependency array to ensure it only runs once on mount

  // Mark messages needing translation when loaded after a refresh
  useEffect(() => {
    // When messages are loaded after a refresh, mark messages that need translation
    if (messages.length > 0) {
      const currentUserId = AuthService.getUser()?.id;
      messages.forEach(message => {
        if (message.userId !== currentUserId && 
            message.language !== currentLanguage && 
            (!message.translations || !message.translations[currentLanguage])) {
          console.log(`Marking message ${message.id} for translation to ${currentLanguage}`);
          TranslationService.addPendingTranslation(message.id, currentLanguage);
        }
      });
    }
  }, [messages.length, currentLanguage]); // Run when messages array length or language changes

  // Set the language preference
  const setLanguagePreference = (language: string) => {
    setCurrentLanguage(language);
    TranslationService.setLanguagePreference(language);
    
    // Mark all messages as needing translation in the new language if they don't already have it
    messages.forEach(message => {
      // Don't mark messages from current user for translation
      const currentUserId = AuthService.getUser()?.id;
      if (message.userId !== currentUserId && message.language !== language) {
        // Check if we already have this translation
        if (!message.translations || !message.translations[language]) {
          console.log(`Marking message ${message.id} for translation to ${language}`);
          TranslationService.addPendingTranslation(message.id, language);
        }
      }
    });
  };

  // Connect to chat server
  const connectToChat = async () => {
    try {
      setIsLoading(true);
      await ChatService.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to chat server'));
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from chat server
  const disconnectFromChat = () => {
    ChatService.disconnect();
    setIsConnected(false);
    setCurrentChatId(null);
    setMessages([]);
    setActiveUsers([]);
    joinedChatRef.current = null;
  };

  // Join a chat room
  const joinChat = async (chatId: string) => {
    try {
      // Skip if we're already in this chat
      if (currentChatId === chatId && joinedChatRef.current === chatId) {
        return;
      }
      
      setIsLoading(true);
      
      // Ensure we're connected first
      if (!isConnected) {
        await connectToChat();
      }
      
      // The joinChat now returns the recent messages directly in its response
      const response = await ChatService.joinChat(chatId);
      
      // Set current chat ID only if it's different
      if (currentChatId !== chatId) {
        setCurrentChatId(chatId);
        
        // Update messages with the recent messages from the response
        if (response && response.recentMessages && response.recentMessages.length > 0) {
          // The backend sorts by createdAt: -1 (newest first), but we want to display oldest first
          // The actual sorting will be handled in ChatPage component
          setMessages(response.recentMessages);
          
          // Import existing translations to our cache
          response.recentMessages.forEach(message => {
            if (message.translations) {
              TranslationService.importTranslations({ [message.id]: message.translations });
            }
            
            // Mark messages for translation if needed
            const currentUserId = AuthService.getUser()?.id;
            if (message.userId !== currentUserId && message.language !== currentLanguage) {
              // Check if we already have this translation
              if (!message.translations || !message.translations[currentLanguage]) {
                console.log(`Marking message ${message.id} from chat history for translation to ${currentLanguage}`);
                TranslationService.addPendingTranslation(message.id, currentLanguage);
              }
            }
          });
        } else {
          setMessages([]);
        }
        
        setActiveUsers([]);
      }
      
      // Set the joinedChatRef to track that we've joined this chat
      joinedChatRef.current = chatId;
      
      setError(null);
    } catch (err) {
      console.error('Failed to join chat room:', err);
      setError(err instanceof Error ? err : new Error('Failed to join chat room'));
    } finally {
      setIsLoading(false);
    }
  };

  // Leave the current chat room
  const leaveChat = async () => {
    try {
      if (currentChatId) {
        await ChatService.leaveChat();
        setCurrentChatId(null);
        setMessages([]);
        setActiveUsers([]);
        joinedChatRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to leave chat room'));
    }
  };

  // Send a new message
  const sendMessage = async (content: string, language: string) => {
    try {
      await ChatService.sendMessage(content, language);
      // Note: We don't add the message to the state here.
      // The server will echo it back through the MESSAGE_RECEIVED event.
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    }
  };

  // Indicate that the user has started typing
  const startTyping = () => {
    ChatService.startTyping();
  };

  // Indicate that the user has stopped typing
  const stopTyping = () => {
    ChatService.stopTyping();
  };

  // Clear any errors
  const clearError = () => {
    setError(null);
  };

  // Event handlers
  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleMessageReceived = (message: Message) => {
    // Mark message for translation if it's not from current user and in a different language
    const currentUserId = AuthService.getUser()?.id;
    if (message.userId !== currentUserId && message.language !== currentLanguage) {
      console.log(`New message ${message.id} received, marking for translation to ${currentLanguage}`);
      TranslationService.addPendingTranslation(message.id, currentLanguage);
    }
    
    // The backend already includes createdAt, so use it as is
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const handleUserJoined = (user: UserPresence) => {
    const currentUserId = AuthService.getUser()?.id;
    
    // Check if the current user is the one joining
    if (user.userId === currentUserId) {
      // If this is a self-join and we've already processed it for this chat, skip processing
      if (joinedChatRef.current === currentChatId) {
        return; // Skip processing to avoid infinite re-renders
      }
      
      // Update the joined chat reference to indicate we've processed the join
      joinedChatRef.current = currentChatId;
    }
    
    // Process other users normally
    setActiveUsers(prevUsers => {
      // If user already exists, update their info
      const exists = prevUsers.some(u => u.userId === user.userId);
      if (exists) {
        return prevUsers.map(u => 
          u.userId === user.userId ? { ...u, ...user, isTyping: false } : u
        );
      }
      // Otherwise add the new user
      return [...prevUsers, { ...user, isTyping: false }];
    });
  };

  const handleUserLeft = (user: { userId: string }) => {
    setActiveUsers(prevUsers => 
      prevUsers.filter(u => u.userId !== user.userId)
    );
  };

  const handleTypingStart = (user: { userId: string }) => {
    setActiveUsers(prevUsers => 
      prevUsers.map(u => 
        u.userId === user.userId ? { ...u, isTyping: true } : u
      )
    );
  };

  const handleTypingStop = (user: { userId: string }) => {
    setActiveUsers(prevUsers => 
      prevUsers.map(u => 
        u.userId === user.userId ? { ...u, isTyping: false } : u
      )
    );
  };

  // Handle translation complete event
  const handleTranslationComplete = (translatedMessage: TranslationCompleteEvent) => {
    // Cache the translation
    TranslationService.cacheTranslation(
      translatedMessage.messageId,
      translatedMessage.language,
      translatedMessage.translatedContent
    );
    
    // Update the message in state
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === translatedMessage.messageId) {
          // Create translations object if it doesn't exist
          const translations = msg.translations || {};
          return {
            ...msg,
            translations: {
              ...translations,
              [translatedMessage.language]: translatedMessage.translatedContent
            }
          };
        }
        return msg;
      })
    );
  };

  const handleError = (err: Error) => {
    console.error('Chat error:', err);
    setError(err);
  };

  // Create a new chat room
  const createChat = async (): Promise<string> => {
    try {
      setIsLoading(true);
      
      // Ensure we're connected first
      if (!isConnected) {
        await connectToChat();
      }
      
      const chatId = await ChatService.createChat();
      setError(null);
      return chatId;
    } catch (err) {
      console.error('Failed to create chat room:', err);
      setError(err instanceof Error ? err : new Error('Failed to create chat room'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create context value object
  const value: ChatContextState = {
    isConnected,
    currentChatId,
    messages,
    activeUsers,
    isLoading,
    error,
    currentLanguage,
    availableLanguages,
    connectToChat,
    disconnectFromChat,
    createChat,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    clearError,
    setLanguagePreference
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 