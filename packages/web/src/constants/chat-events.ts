/**
 * Socket.IO event names for chat functionality
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Chat room events
  CREATE_CHAT: 'create_chat',
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  
  // Message events
  NEW_MESSAGE: 'new_message',
  MESSAGE_RECEIVED: 'message_received',
  
  // User presence events
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  
  // Translation events
  TRANSLATION_COMPLETE: 'translation_complete',
  LANGUAGE_CHANGE: 'language_change',
  
  // Error events
  ERROR: 'error'
}; 