import { Message } from '../contexts/ChatContext';

// Interface for formatted messages used in chat components
export interface FormattedMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: Date; // Keep timestamp for UI display but derive from createdAt
  translations: Array<{ language: string; text: string }>;
  originalLanguage?: string; // The original language of the message
}

/**
 * Formats a message from the Chat context to the format expected by UI components
 */
export const formatMessage = (msg: Message): FormattedMessage => ({
  id: msg.id,
  content: msg.content,
  sender: {
    id: msg.userId,
    name: msg.username,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`,
  },
  // Use createdAt from the server converted to a Date object for display
  timestamp: msg.createdAt instanceof Date 
    ? msg.createdAt 
    : new Date(msg.createdAt),
  translations: msg.translations ? 
    Object.entries(msg.translations).map(([language, text]) => ({ 
      language, 
      text 
    })) : [],
  originalLanguage: msg.language, // Include the original language
});

/**
 * Format timestamp as human-readable time string
 */
export const formatTime = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(timestamp);
}; 