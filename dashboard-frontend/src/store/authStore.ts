import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  setUser: (user: User) => void;
}

const API_URL = process.env.REACT_APP_API_URL;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
          });

          const { user, accessToken, refreshToken } = response.data;
          
          // Configure axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },

      logout: () => {
        // Clear axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });

          const { user, accessToken, refreshToken: newRefreshToken } = response.data;
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          set({
            user,
            accessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
            error: null
          });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ accessToken, refreshToken });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'lumaa-auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Setup axios interceptors
axios.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuthStore.getState().refreshAuth();
        return axios(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);