import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '../services/AuthService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      /**
       * Register a new user
       */
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.register(userData);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      /**
       * Login user
       */
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.login(credentials);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await AuthService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Get user profile
       */
      getProfile: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await AuthService.getProfile();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return user;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      /**
       * Update user profile
       */
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedUser = await AuthService.updateProfile(profileData);
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
          
          return updatedUser;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      /**
       * Change password
       */
      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.changePassword(passwordData);
          
          set({
            isLoading: false,
            error: null,
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      /**
       * Initialize auth state on app load
       */
      initializeAuth: async () => {
        const isAuthenticated = AuthService.isAuthenticated();
        
        if (isAuthenticated) {
          try {
            const user = await AuthService.getProfile();
            set({
              user,
              isAuthenticated: true,
              error: null,
            });
          } catch (error) {
            // If profile fetch fails, clear auth state
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
            AuthService.logout();
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set loading state
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore; 