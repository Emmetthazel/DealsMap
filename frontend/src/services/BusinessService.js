import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const STORAGE_TYPE_KEY = 'auth_storage_type';

// Helper functions for storage management
const getStorage = () => {
  const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
  return storageType === 'local' ? localStorage : sessionStorage;
};

const getAccessToken = () => {
  const storage = getStorage();
  return storage.getItem(ACCESS_TOKEN_KEY);
};

const businessAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
businessAPI.interceptors.request.use(
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
businessAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getStorage().getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await businessAPI.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          const rememberMe = localStorage.getItem(STORAGE_TYPE_KEY) === 'local';
          
          // Store the new access token in the same storage type
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(ACCESS_TOKEN_KEY, access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return businessAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

class BusinessService {
  /**
   * Get all businesses with optional filters
   * @param {Object} filters - Filter parameters
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} - Businesses response
   */
  static async getBusinesses(filters = {}, page = 1, pageSize = 10) {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };
      
      const response = await businessAPI.get('/businesses/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific business by ID
   * @param {string} businessId - Business ID
   * @returns {Promise} - Business data
   */
  static async getBusiness(businessId) {
    try {
      const response = await businessAPI.get(`/businesses/${businessId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new business
   * @param {Object} businessData - Business data
   * @param {File} imageFile - Business image file (optional)
   * @returns {Promise} - Created business data
   */
  static async createBusiness(businessData, imageFile = null) {
    try {
      const formData = new FormData();
      
      // Add business data
      Object.keys(businessData).forEach(key => {
        if (businessData[key] !== null && businessData[key] !== undefined) {
          if (key === 'opening_hours') {
            formData.append(key, JSON.stringify(businessData[key]));
          } else {
            formData.append(key, businessData[key]);
          }
        }
      });
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await businessAPI.post('/businesses/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing business
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Updated business data
   * @param {File} imageFile - New business image file (optional)
   * @returns {Promise} - Updated business data
   */
  static async updateBusiness(businessId, businessData, imageFile = null) {
    try {
      const formData = new FormData();
      
      // Add business data
      Object.keys(businessData).forEach(key => {
        if (businessData[key] !== null && businessData[key] !== undefined) {
          if (key === 'opening_hours') {
            formData.append(key, JSON.stringify(businessData[key]));
          } else {
            formData.append(key, businessData[key]);
          }
        }
      });
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await businessAPI.put(`/businesses/${businessId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a business
   * @param {string} businessId - Business ID
   * @returns {Promise} - Deletion response
   */
  static async deleteBusiness(businessId) {
    try {
      const response = await businessAPI.delete(`/businesses/${businessId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find nearby businesses
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in km
   * @param {Object} filters - Additional filters
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} - Nearby businesses response
   */
  static async getNearbyBusinesses(lat, lng, radius = 10, filters = {}, page = 1, pageSize = 10) {
    try {
      const params = {
        lat,
        lng,
        radius,
        page,
        page_size: pageSize,
        ...filters
      };
      
      const response = await businessAPI.get('/businesses/nearby/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate distance from a business to a point
   * @param {string} businessId - Business ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise} - Distance calculation response
   */
  static async calculateDistance(businessId, lat, lng) {
    try {
      const params = { lat, lng };
      const response = await businessAPI.get(`/businesses/${businessId}/distance/`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload business image
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} - Upload response
   */
  static async uploadImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await businessAPI.post('/businesses/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get business statistics
   * @param {string} businessId - Business ID
   * @returns {Promise} - Business statistics
   */
  static async getBusinessStats(businessId) {
    try {
      const response = await businessAPI.get(`/businesses/${businessId}/stats/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
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
        return new Error('Authentication required');
      }
      
      if (status === 403) {
        return new Error('Access denied');
      }
      
      if (status === 404) {
        return new Error('Business not found');
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

export default BusinessService;
