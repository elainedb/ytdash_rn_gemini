import { create } from 'zustand';
import { ENV } from '../config/env';

interface AuthState {
  userEmail: string | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  loginError: string | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userEmail: null,
  isAuthenticated: false,
  isAuthorized: false,
  loginError: null,
  login: (email: string) => {
    const isAuth = ENV.AUTHORIZED_EMAILS.includes(email);
    if (isAuth) {
      set({ userEmail: email, isAuthenticated: true, isAuthorized: true, loginError: null });
    } else {
      set({ userEmail: email, isAuthenticated: true, isAuthorized: false, loginError: 'Unauthorized email' });
    }
  },
  logout: () => {
    set({ userEmail: null, isAuthenticated: false, isAuthorized: false, loginError: null });
  },
}));
