import ApiClient from './ApiClient';
import { 
  TokenPayloadDto, 
  LoginResponseDto, 
  ApiResponseDto,
  LoginDto
} from '@chatti/shared-types';

// Token storage keys
const TOKEN_STORAGE_KEY = 'chatti_auth_token';
const USER_STORAGE_KEY = 'chatti_user';

/**
 * Decodes JWT token to extract payload
 */
function decodeToken(token: string): TokenPayloadDto | null {
  try {
    // JWT tokens are in format: header.payload.signature
    // We need the payload part which is the second segment
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload as TokenPayloadDto;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

/**
 * Authentication service for handling login and token management
 */
export class AuthService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
    
    // Initialize with stored token if available
    const token = this.getToken();
    if (token) {
      this.client.setAuthToken(token);
    }
  }

  /**
   * Login with a username (guest login)
   */
  async login(name?: string): Promise<{ id: string; name: string; avatar: string; token: string }> {
    try {
      const loginDto: LoginDto = { name };
      const response = await this.client.post<ApiResponseDto<LoginResponseDto>>('/auth/login', loginDto);
      
      if (response.data.success && response.data.data) {
        const { token, name, avatar } = response.data.data;
        
        // Extract userId from JWT token
        const payload = decodeToken(token);
        const userId = payload?.userId || `guest-${Date.now()}`;
        
        // Store the token and user data
        this.setToken(token);
        this.setUser({ id: userId, name, avatar });
        
        // Set token for future API calls
        this.client.setAuthToken(token);
        
        return { id: userId, token, name, avatar };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout the user
   */
  logout(): void {
    // Clear stored data
    this.clearToken();
    this.clearUser();
    
    // Clear auth header
    this.client.clearAuthToken();
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Set token in storage
   */
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  /**
   * Clear token from storage
   */
  private clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Get user data from storage
   */
  getUser(): { id: string; name: string; avatar: string } | null {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set user data in storage
   */
  private setUser(user: { id: string; name: string; avatar: string }): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Clear user data from storage
   */
  private clearUser(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export default new AuthService(); 