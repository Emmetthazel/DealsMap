import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AuthService from '../services/AuthService';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,

      // Actions
      /**
       * Register a new user
       */
      register: async (userData, rememberMe = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.register(userData, rememberMe);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe,
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
      login: async (credentials, rememberMe = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.login(credentials, rememberMe);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe,
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
          // Silent error handling
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            rememberMe: false,
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
       * This function checks if tokens exist and are valid
       */
      initializeAuth: async () => {
        const isAuthenticated = AuthService.isAuthenticated();
        const rememberMe = AuthService.getStorageType() === 'local';
        
        if (isAuthenticated) {
          try {
            const user = await AuthService.getProfile();
            
            set({
              user,
              isAuthenticated: true,
              error: null,
              rememberMe,
            });
          } catch (error) {
            // If profile fetch fails, clear auth state
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              rememberMe: false,
            });
            AuthService.logout();
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            rememberMe: false,
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

      /**
       * Set remember me state
       */
      setRememberMe: (rememberMe) => {
        set({ rememberMe });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist rememberMe, NOT user or isAuthenticated
        // This forces re-authentication on app restart
        rememberMe: state.rememberMe,
      }),
    }
  )
);

export default useAuthStore; 