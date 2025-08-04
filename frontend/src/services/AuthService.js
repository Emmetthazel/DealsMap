import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = 'http://localhost:8000/api';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add token to request headers
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await authAPI.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return authAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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
   * @returns {Promise} - Registration response
   */
  static async register(userData) {
    try {
      const response = await authAPI.post('/auth/register/', userData);
      
      // Store tokens if registration is successful
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} - Login response
   */
  static async login(credentials) {
    try {
      console.log('AuthService login - sending credentials:', credentials);
      const response = await authAPI.post('/auth/login/', credentials); // Send login credentials to the server
      
      console.log('AuthService login - response:', response.data);
      
      // Store tokens
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
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
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.post('/auth/logout/', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Get current user profile
   * @returns {Promise} - User profile data
   */
  static async getProfile() {
    try {
      const response = await authAPI.get('/auth/profile/'); // Get user profile from the server
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
      const response = await authAPI.put('/auth/profile/', profileData); // put request to update user profile
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
      const response = await authAPI.post('/auth/change-password/', passwordData); // Send password change data to the server
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
    return !!localStorage.getItem('access_token'); // Check if access token is present in local storage
  }

  /**
   * Get stored tokens
   * @returns {Object} - Access and refresh tokens
   */
  static getTokens() {
    return {
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    };
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