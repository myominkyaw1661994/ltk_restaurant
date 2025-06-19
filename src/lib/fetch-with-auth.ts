import { getAuthToken, clearAuthData } from './auth';

interface FetchWithAuthOptions extends RequestInit {
  redirectOnAuthError?: boolean;
}

/**
 * Enhanced fetch function that automatically includes JWT token from localStorage
 * This can be used as a drop-in replacement for fetch() in components
 */
export async function fetchWithAuth(
  url: string, 
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const { redirectOnAuthError = true, ...fetchOptions } = options;
  
  // Get token from localStorage
  const token = getAuthToken();
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Add token in multiple ways for maximum compatibility
  if (token) {
    // Primary: Authorization header (standard)
    headers['Authorization'] = `Bearer ${token}`;
    
    // Fallback: Custom header for middleware access
    headers['x-auth-token'] = token;
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401 && redirectOnAuthError) {
    clearAuthData();
    window.location.href = '/auth';
  }

  return response;
}

/**
 * Convenience function for GET requests with auth
 */
export async function getWithAuth<T>(
  url: string, 
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const response = await fetchWithAuth(url, { ...options, method: 'GET' });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Convenience function for POST requests with auth
 */
export async function postWithAuth<T>(
  url: string, 
  body: any, 
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Convenience function for PUT requests with auth
 */
export async function putWithAuth<T>(
  url: string, 
  body: any, 
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Convenience function for DELETE requests with auth
 */
export async function deleteWithAuth<T>(
  url: string, 
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const response = await fetchWithAuth(url, { ...options, method: 'DELETE' });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
} 