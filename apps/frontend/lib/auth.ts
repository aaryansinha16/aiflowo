/* eslint-disable no-undef */
/**
 * Auth utility functions for token management
 */

const TOKEN_KEY = 'aiflowo_token';
const USER_KEY = 'aiflowo_user';

export interface User {
  id: string;
  email: string;
  name?: string;
  profile?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

/**
 * Store auth tokens in localStorage
 */
export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  }
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear auth tokens from localStorage
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
