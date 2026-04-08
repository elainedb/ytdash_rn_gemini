import { create } from 'zustand';
import { User } from '../../domain/entities/user';
import { container } from '../../../../core/di/container';

type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  errorMessage: string | null;
  checkAuthStatus: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'initial',
  user: null,
  errorMessage: null,

  checkAuthStatus: async () => {
    set({ status: 'loading', errorMessage: null });
    const result = await container.getCurrentUser.execute();
    
    if (result.ok) {
      if (result.data) {
        set({ status: 'authenticated', user: result.data });
      } else {
        set({ status: 'unauthenticated', user: null });
      }
    } else {
      set({ status: 'unauthenticated', user: null, errorMessage: result.error.message });
    }
  },

  signIn: async () => {
    set({ status: 'loading', errorMessage: null });
    const result = await container.signInWithGoogle.execute();
    
    if (result.ok) {
      set({ status: 'authenticated', user: result.data });
    } else {
      set({ status: 'error', errorMessage: result.error.message });
    }
  },

  signOut: async () => {
    set({ status: 'loading', errorMessage: null });
    await container.signOut.execute();
    set({ status: 'unauthenticated', user: null });
  },
}));
