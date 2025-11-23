'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { apiClient } from '@/lib/api-generated';

interface User {
  id: string;
  email: string;
  name?: string;
  profile?: Record<string, unknown>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  sendMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

      setToken: (token) => set({ token, isLoading: false }),

      sendMagicLink: async (email) => {
        try {
          const { data, error } = await apiClient.POST('/api/auth/magic-link/send', {
            body: { email } as any,
          });
          
          if (error) {
            throw new Error('Failed to send magic link');
          }
          
          return { success: true, message: 'Magic link sent successfully' };
        } catch (err) {
          console.error('Send magic link error:', err);
          throw err;
        }
      },

      verifyMagicLink: async (token) => {
        try {
          const { data, error } = await apiClient.POST('/api/auth/magic-link/verify', {
            body: { token } as any,
          });

          if (error) {
            throw new Error((error as any).message || 'Failed to verify magic link');
          }

          // Store token and user
          if (data) {
            set({
              token: (data as any).accessToken,
              user: (data as any).user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Verify magic link error:', error);
          throw error;
        }
      },

      register: async (registerData) => {
        try {
          const { data, error } = await (apiClient.POST as any)('/api/auth/register', {
            body: { email: registerData.email, password: registerData.password, name: registerData.name },
          });

          if (error) {
            throw new Error((error as any).message || 'Registration failed');
          }

          if (data) {
            set({
              token: (data as any).accessToken,
              user: (data as any).user,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Register error:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          const token = get().token;
          
          if (token) {
            await apiClient.POST('/api/auth/logout', {});
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        try {
          const token = get().token;
          
          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const { data: user, error } = await apiClient.GET('/api/auth/me');

          if (error) {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          } else {
            set({ user, isAuthenticated: true, isLoading: false });
          }
        } catch (error) {
          console.error('Check auth error:', error);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
