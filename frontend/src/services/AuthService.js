import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const STORAGE_TYPE_KEY = 'auth_storage_type'; // 'local' or 'session'

// Helper functions for storage management
const getStorage = () => {
  const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
  return storageType === 'local' ? localStorage : sessionStorage;
};

const setTokens = (tokens, rememberMe) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  localStorage.setItem(STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
};

const getAccessToken = () => {
  const storage = getStorage();
  return storage.getItem(ACCESS_TOKEN_KEY);
};

const getRefreshToken = () => {
  const storage = getStorage();
  return storage.getItem(REFRESH_TOKEN_KEY);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(STORAGE_TYPE_KEY);
};

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
authAPI.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await authAPI.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          const rememberMe = localStorage.getItem(STORAGE_TYPE_KEY) === 'local';
          
          // Store the new access token in the same storage type
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(ACCESS_TOKEN_KEY, access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return authAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise} - Registration response
   */
  static async register(userData, rememberMe = false) {
    try {
      const response = await authAPI.post('/auth/register/', userData);
      
      // Store tokens if registration is successful
      if (response.data.tokens) {
        setTokens(response.data.tokens, rememberMe);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise} - Login response
   */
  static async login(credentials, rememberMe = false) {
    try {
      console.log('AuthService login - sending credentials:', credentials);
      console.log('AuthService login - rememberMe:', rememberMe);
      
      const response = await authAPI.post('/auth/login/', credentials);
      
      console.log('AuthService login - response:', response.data);
      
      // Store tokens in the appropriate storage
      if (response.data.tokens) {
        setTokens(response.data.tokens, rememberMe);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   * @returns {Promise} - Logout response
   */
  static async logout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authAPI.post('/auth/logout/', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      clearTokens();
    }
  }

  /**
   * Get current user profile
   * @returns {Promise} - User profile data
   */
  static async getProfile() {
    try {
      const response = await authAPI.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Updated profile data
   */
  static async updateProfile(profileData) {
    try {
      const response = await authAPI.put('/auth/profile/', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise} - Password change response
   */
  static async changePassword(passwordData) {
    try {
      const response = await authAPI.post('/auth/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  static isAuthenticated() {
    return !!getAccessToken();
  }

  /**
   * Get stored tokens
   * @returns {Object} - Access and refresh tokens
   */
  static getTokens() {
    return {
      access: getAccessToken(),
      refresh: getRefreshToken(),
    };
  }

  /**
   * Get storage type (local or session)
   * @returns {string} - Storage type
   */
  static getStorageType() {
    return localStorage.getItem(STORAGE_TYPE_KEY) || 'session';
  }

  /**
   * Handle API errors
   * @param {Error} error - API error
   * @returns {Error} - Formatted error
   */
  static handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;
      
      // Handle validation errors
      if (status === 400 && data) {
        const errorMessages = [];
        
        // Extract error messages from Django REST Framework format
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            errorMessages.push(...data[key]);
          } else {
            errorMessages.push(data[key]);
          }
        });
        
        return new Error(errorMessages.join(', '));
      }
      
      // Handle other status codes
      if (status === 401) {
        return new Error('Invalid credentials');
      }
      
      if (status === 403) {
        return new Error('Access denied');
      }
      
      if (status === 404) {
        return new Error('Resource not found');
      }
      
      if (status >= 500) {
        return new Error('Server error. Please try again later.');
      }
      
      return new Error(data?.message || 'An error occurred');
    }
    
    if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    }
    
    // Other errors
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default AuthService; 