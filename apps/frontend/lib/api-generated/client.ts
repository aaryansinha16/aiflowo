/**
 * Type-Safe API Client
 * Auto-generated from OpenAPI spec
 */

import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

// Don't include /api in baseUrl since OpenAPI paths already include it
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:4000';

// Create the base client
export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL });

/**
 * Auth middleware to add JWT token to requests
 */
export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = getToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return request;
  },
};

/**
 * Get authentication token
 * Override this function to use your auth system
 */
let getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get from Zustand store
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('Failed to get token:', error);
  }
  
  return null;
};

/**
 * Set custom token getter
 */
export const setTokenGetter = (getter: () => string | null) => {
  getToken = getter;
};

/**
 * Configure client with auth middleware
 */
export const configureClient = (token?: string) => {
  if (token) {
    // Override token getter with provided token
    setTokenGetter(() => token);
  }
  
  // Add auth middleware
  apiClient.use(authMiddleware);
  
  return apiClient;
};

// Auto-configure on import
if (typeof window !== 'undefined') {
  apiClient.use(authMiddleware);
}

// Export typed operations for convenience
export type ApiClient = typeof apiClient;
export type ApiPaths = paths;
