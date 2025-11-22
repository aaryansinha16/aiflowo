'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

      login: async (email) => {
        // TODO: Implement actual API call
        // const response = await fetch('/api/auth/magic-link', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ email }),
        // });
        //
        // if (!response.ok) throw new Error('Failed to send magic link');
        
        console.log('Sending magic link to:', email);
      },

      register: async (data) => {
        // TODO: Implement actual API call
        // const response = await fetch('/api/auth/register', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data),
        // });
        //
        // if (!response.ok) {
        //   const error = await response.json();
        //   throw new Error(error.message || 'Registration failed');
        // }
        //
        // const user = await response.json();
        // set({ user, isAuthenticated: true });
        
        console.log('Registering user:', data);
      },

      logout: async () => {
        // TODO: Implement actual API call
        // await fetch('/api/auth/logout', { method: 'POST' });
        
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          // TODO: Implement actual API call
          // const response = await fetch('/api/auth/me');
          // 
          // if (response.ok) {
          //   const user = await response.json();
          //   set({ user, isAuthenticated: true, isLoading: false });
          // } else {
          //   set({ user: null, isAuthenticated: false, isLoading: false });
          // }
          
          set({ isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
