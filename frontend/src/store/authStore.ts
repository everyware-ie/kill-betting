import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  login: (token: string, user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  setUser: (user) => set({ user, isAuthenticated: true }),

  login: (token, user) => {
    localStorage.setItem('accessToken', token);
    set({ user: user as User, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },
}));
