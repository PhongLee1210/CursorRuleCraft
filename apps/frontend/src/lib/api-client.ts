import { API_BASE_URL } from '@/lib/constants';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
  message?: string;
}

/**
 * HTTP client configuration
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Creates an authenticated API client that automatically injects Clerk tokens
 */
export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.getToken = getToken;
  }

  /**
   * Makes an authenticated HTTP request to the backend
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    try {
      const { params, headers: customHeaders, ...restConfig } = config;

      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        url += `?${searchParams.toString()}`;
      }

      // Get Clerk authentication token
      const token = await this.getToken();

      // Prepare headers
      const headers = new Headers(customHeaders);
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Make the request
      const response = await fetch(url, {
        ...restConfig,
        headers,
      });

      // Parse response
      const data = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        return {
          data: null,
          error: new Error(data.message || `HTTP ${response.status}: ${response.statusText}`),
          message: data.message,
        };
      }

      return {
        data,
        error: null,
        message: data.message,
      };
    } catch (error) {
      console.error('[ApiClient] Request error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Makes a GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Makes a POST request
   */
  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a PUT request
   */
  async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a PATCH request
   */
  async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

/**
 * React hook to create an authenticated API client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const apiClient = useApiClient();
 *
 *   const fetchData = async () => {
 *     const { data, error } = await apiClient.get('/api/users/me');
 *     if (error) {
 *       console.error('Error:', error);
 *       return;
 *     }
 *     console.log('User data:', data);
 *   };
 * }
 * ```
 */
export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return new ApiClient(API_BASE_URL, getToken);
  }, [getToken]);
}
