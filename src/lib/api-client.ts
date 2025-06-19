import { getAuthHeaders, clearAuthData, getAuthToken } from './auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Get token from localStorage
      const token = getAuthToken();
      
      // Prepare headers with multiple token options
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Add token in multiple ways for maximum compatibility
      if (token) {
        // Primary: Authorization header (standard)
        headers['Authorization'] = `Bearer ${token}`;
        
        // Fallback: Custom header for middleware access
        headers['x-auth-token'] = token;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors
      if (response.status === 401) {
        // Clear auth data and redirect to login
        clearAuthData();
        window.location.href = '/auth';
        return {
          success: false,
          error: 'Authentication required. Please login again.',
        };
      }

      // Handle forbidden errors
      if (response.status === 403) {
        return {
          success: false,
          error: 'Insufficient permissions for this action.',
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export { ApiClient };

// Convenience functions
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) => apiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, body?: any) => apiClient.post<T>(endpoint, body),
  put: <T>(endpoint: string, body?: any) => apiClient.put<T>(endpoint, body),
  delete: <T>(endpoint: string) => apiClient.delete<T>(endpoint),
}; 