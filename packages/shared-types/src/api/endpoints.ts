/**
 * API endpoints for service-to-service communication
 */
export const API_ENDPOINTS = {
  // Translation service endpoints
  TRANSLATION: {
    QUEUE: '/translation/queue',
  },
  
  // Chat service endpoints
  CHAT: {
    TRANSLATIONS_NOTIFY: '/chat/translations/notify',
    MESSAGES: (chatId: string) => `/chat/${chatId}/messages`,
  },
}; 