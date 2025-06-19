// Simple authentication utility

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthData {
  token: string;
  user: User;
}

// Set cookie helper
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

// Remove cookie helper
const removeCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Get auth data from localStorage
export const getAuthData = (): AuthData | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  
  if (!token || !userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return { token, user };
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return null;
  }
};

// Set auth data in localStorage and cookies
export const setAuthData = (authData: AuthData): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('auth_token', authData.token);
  localStorage.setItem('auth_user', JSON.stringify(authData.user));
  
  // Also store token in cookie for middleware access
  setCookie('auth_token', authData.token, 1); // 1 day expiry
};

// Clear auth data from localStorage and cookies
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  
  // Also remove cookie
  removeCookie('auth_token');
};

// Get current user
export const getCurrentUser = (): User | null => {
  const authData = getAuthData();
  return authData?.user || null;
};

// Get auth token
export const getAuthToken = (): string | null => {
  const authData = getAuthData();
  return authData?.token || null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getAuthData() !== null;
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

// Create auth headers for API requests
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const auth = {
  // Check if user is logged in
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isLoggedIn') === 'true';
  },

  // Login user
  login: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  },

  // Logout user
  logout: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  },

  // Check if user is manager
  isManager: (): boolean => {
    return hasRole('Manager') || hasRole('Admin');
  }
}; 