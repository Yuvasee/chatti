import { io, Socket } from 'socket.io-client';
import AuthService from './AuthService';
import { 
  JoinChatDto, 
  MessageDto,
  CreateChatDto,
  SocketResponseDto,
} from '@chatti/shared-types';
import { TranslationCompleteEvent } from '../contexts/ChatContext';
import { SOCKET_EVENTS } from '../constants/chat-events';

// Socket.IO server URL (chat service)
const SOCKET_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:4001';

// Type for chat room creation response data
interface CreateChatResponseData {
  chatId: string;
}

// Type for message response data
interface MessageResponseData {
  messageId: string;
}

/**
 * Chat service for handling real-time communication using Socket.IO
 */
export class ChatService {
  private socket: Socket | null = null;
  private reconnectTimer: number | null = null;
  private chatId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialize chat service
   */
  constructor() {
    this.setupEventListenersMap();
  }

  /**
   * Initialize event listeners map
   */
  private setupEventListenersMap(): void {
    Object.values(SOCKET_EVENTS).forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  /**
   * Connect to the chat server with authentication
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get auth token
      const token = AuthService.getToken();
      
      if (!token) {
        console.error('ChatService: No authentication token found');
        reject(new Error('Authentication required'));
        return;
      }

      // If already connected, disconnect first
      if (this.socket) {
        console.log('ChatService: Already connected, disconnecting first');
        this.socket.disconnect();
      }

      // Clear any pending reconnect timers
      if (this.reconnectTimer) {
        console.log('ChatService: Clearing existing reconnect timer');
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      console.log(`ChatService: Connecting to ${SOCKET_URL} with auth token`);
      
      // Connect to chat server with auth token
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Handle connection events
      this.socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('ChatService: Connected to chat server successfully');
        resolve();
        this.notifyListeners(SOCKET_EVENTS.CONNECT);
      });

      this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
        console.error('ChatService: Connection error:', err);
        reject(err);
        this.notifyListeners(SOCKET_EVENTS.CONNECT_ERROR, err);
        this.scheduleReconnect();
      });

      this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('ChatService: Disconnected from chat server, reason:', reason);
        this.notifyListeners(SOCKET_EVENTS.DISCONNECT, reason);
        
        // If not closed by client intentionally, try to reconnect
        if (reason !== 'io client disconnect') {
          this.scheduleReconnect();
        }
      });

      // Debug all socket.io related events
      this.socket.onAny((event, ...args) => {
        console.log(`ChatService: Received event "${event}"`, args);
      });

      // Set up message listeners
      this.setupMessageListeners();
    });
  }

  /**
   * Set up message event listeners
   */
  private setupMessageListeners(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, (message) => {
      this.notifyListeners(SOCKET_EVENTS.MESSAGE_RECEIVED, message);
    });

    this.socket.on(SOCKET_EVENTS.USER_JOINED, (user) => {
      this.notifyListeners(SOCKET_EVENTS.USER_JOINED, user);
    });

    this.socket.on(SOCKET_EVENTS.USER_LEFT, (user) => {
      this.notifyListeners(SOCKET_EVENTS.USER_LEFT, user);
    });

    this.socket.on(SOCKET_EVENTS.TYPING_START, (user) => {
      this.notifyListeners(SOCKET_EVENTS.TYPING_START, user);
    });

    this.socket.on(SOCKET_EVENTS.TYPING_STOP, (user) => {
      this.notifyListeners(SOCKET_EVENTS.TYPING_STOP, user);
    });

    this.socket.on(SOCKET_EVENTS.TRANSLATION_COMPLETE, (translatedMessage: TranslationCompleteEvent) => {
      this.notifyListeners(SOCKET_EVENTS.TRANSLATION_COMPLETE, translatedMessage);
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
      this.notifyListeners(SOCKET_EVENTS.ERROR, error);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect().catch((err) => {
        console.error('Reconnection failed:', err);
      });
      this.reconnectTimer = null;
    }, 3000);
  }

  /**
   * Disconnect from the chat server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.chatId = null;
  }

  /**
   * Create a new chat room
   */
  createChat(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error('ChatService: Not connected to chat server');
        reject(new Error('Not connected to chat server'));
        return;
      }

      const user = AuthService.getUser();
      if (!user) {
        console.error('ChatService: User not authenticated');
        reject(new Error('User not authenticated'));
        return;
      }
      
      // Empty payload - user data is extracted from JWT on server side
      const createChatDto: CreateChatDto = {};
      
      console.log('ChatService: Emitting create_chat event');
      
      this.socket.emit(
        SOCKET_EVENTS.CREATE_CHAT, 
        createChatDto, 
        (response: SocketResponseDto<CreateChatResponseData>) => {
          console.log('ChatService: Received create_chat acknowledgment:', response);
          if (response.success && response.data?.chatId) {
            const chatId = response.data.chatId;
            console.log('ChatService: Successfully created chat room:', chatId);
            resolve(chatId);
          } else {
            const errorMessage = response.message || 'Unknown error';
            console.error('ChatService: Failed to create chat:', errorMessage);
            
            const error = new Error(errorMessage);
            if (response.code) {
              (error as any).code = response.code;
            }
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): Promise<{ chatId: string; recentMessages: any[] }> {
    return new Promise((resolve, reject) => {
      console.log('ChatService: Joining chat room:', chatId);
      
      if (!this.socket) {
        console.error('ChatService: Not connected to chat server');
        reject(new Error('Not connected to chat server'));
        return;
      }

      const user = AuthService.getUser();
      if (!user) {
        console.error('ChatService: User not authenticated');
        reject(new Error('User not authenticated'));
        return;
      }
      
      // Only chatId is needed - user data is extracted from JWT on server side
      const joinChatDto: JoinChatDto = {
        chatId
      };

      this.socket.emit(
        SOCKET_EVENTS.JOIN_CHAT, 
        joinChatDto, 
        (response: SocketResponseDto<{ chatId: string; recentMessages: any[] }>) => {
          if (response.success && response.data) {
            console.log('ChatService: Successfully joined chat room with data:', response.data);
            this.chatId = chatId;
            resolve(response.data);
          } else {
            console.error('ChatService: Failed to join chat:', response.message || 'Unknown error');
            
            const error = new Error(response.message || 'Failed to join chat');
            if (response.code) {
              (error as any).code = response.code;
            }
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Leave the current chat room
   */
  leaveChat(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.chatId) {
        resolve(); // Already not in a chat
        return;
      }

      const user = AuthService.getUser();
      if (!user) {
        console.error('ChatService: User not authenticated');
        reject(new Error('User not authenticated'));
        return;
      }

      const leaveData = {
        chatId: this.chatId,
        userId: user.id,
        username: user.name
      };

      this.socket.emit(
        SOCKET_EVENTS.LEAVE_CHAT, 
        leaveData, 
        (response: SocketResponseDto) => {
          if (response.success) {
            this.chatId = null;
            resolve();
          } else {
            console.error('ChatService: Failed to leave chat:', response.message || 'Unknown error');
            
            const error = new Error(response.message || 'Failed to leave chat');
            if (response.code) {
              (error as any).code = response.code;
            }
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Send a new message to the current chat
   */
  sendMessage(content: string, language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.chatId) {
        console.error('ChatService: Not connected to a chat room');
        reject(new Error('Not connected to a chat room'));
        return;
      }

      const user = AuthService.getUser();
      if (!user) {
        console.error('ChatService: User not authenticated');
        reject(new Error('User not authenticated'));
        return;
      }

      const messageDto: MessageDto = {
        chatId: this.chatId,
        userId: user.id,
        username: user.name,
        content,
        language
      };

      this.socket.emit(
        SOCKET_EVENTS.NEW_MESSAGE, 
        messageDto, 
        (response: SocketResponseDto<MessageResponseData>) => {
          if (response.success) {
            resolve();
          } else {
            console.error('ChatService: Failed to send message:', response.message || 'Unknown error', response.code);
            const error = new Error(response.message || 'Failed to send message');
            // Add the error code as a property to the Error object
            if (response.code) {
              (error as any).code = response.code;
            }
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Indicate that the user has started typing
   */
  startTyping(): void {
    if (!this.socket || !this.chatId) return;

    const user = AuthService.getUser();
    if (!user) return;

    this.socket.emit(SOCKET_EVENTS.TYPING_START, {
      chatId: this.chatId,
      userId: user.id,
      username: user.name
    });
  }

  /**
   * Indicate that the user has stopped typing
   */
  stopTyping(): void {
    if (!this.socket || !this.chatId) return;

    const user = AuthService.getUser();
    if (!user) return;

    this.socket.emit(SOCKET_EVENTS.TYPING_STOP, {
      chatId: this.chatId,
      userId: user.id,
      username: user.name
    });
  }

  /**
   * Add event listener for socket events
   */
  on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if connected to chat server
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Get current chat ID
   */
  getCurrentChatId(): string | null {
    return this.chatId;
  }

  /**
   * Emit an event to the socket server
   */
  emit(event: string, data: any): void {
    if (this.socket && this.isConnected()) {
      console.log(`ChatService: Emitting ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`ChatService: Cannot emit ${event}, not connected`);
    }
  }
}

export default new ChatService(); 