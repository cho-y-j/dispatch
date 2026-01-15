import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import * as authApi from '../api/auth';
import { fcmService } from '../services/fcm';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; phone: string; role: string }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          if (response.success && response.data) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });

            // FCM 토큰 등록
            fcmService.registerToken().catch(console.error);

            return true;
          }
        } catch (error) {
          console.error('Login failed:', error);
        }
        set({ isLoading: false });
        return false;
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          if (response.success && response.data) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
        } catch (error) {
          console.error('Register failed:', error);
        }
        set({ isLoading: false });
        return false;
      },

      logout: () => {
        // FCM 토큰 삭제
        fcmService.unregisterToken().catch(console.error);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
