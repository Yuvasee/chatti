import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Get API URL from environment variables or use default for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Base API client that handles common HTTP operations
 */
export class ApiClient {
  private client: AxiosInstance;
  
  /**
   * Initialize the API client with default configuration
   */
  constructor(config: AxiosRequestConfig = {}) {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });
  }

  /**
   * Set authorization token for all requests
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization token
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Perform GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * Perform POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * Perform PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * Perform DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export default ApiClient; 