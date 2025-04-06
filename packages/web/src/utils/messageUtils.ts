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
  timestamp: Date;
  translations: Array<{ language: string; text: string }>;
}

/**
 * Formats a message from the Chat context to the format expected by UI components
 */
export const formatMessage = (msg: Message): FormattedMessage => ({
  id: msg.id || `msg-${Date.now()}-${Math.random()}`,
  content: msg.content,
  sender: {
    id: msg.userId,
    name: msg.username,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`,
  },
  timestamp: msg.timestamp || new Date(),
  translations: msg.translations ? 
    Object.entries(msg.translations).map(([language, text]) => ({ 
      language, 
      text 
    })) : [],
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