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

const getRefreshToken = () => {
  const storage = getStorage();
  return storage.getItem(REFRESH_TOKEN_KEY);
};

const setTokens = (tokens, rememberMe) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  localStorage.setItem(STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(STORAGE_TYPE_KEY);
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await api.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          const rememberMe = localStorage.getItem(STORAGE_TYPE_KEY) === 'local';
          
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(ACCESS_TOKEN_KEY, access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch {
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // GET request
  get: (url, config = {}) => api.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => api.delete(url, config),
  
  // Upload file
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Download file
  download: (url, config = {}) => {
    return api.get(url, {
      ...config,
      responseType: 'blob',
    });
  },
  
  // Storage utility methods
  getAccessToken,
  getRefreshToken,
  isAuthenticated: () => !!getAccessToken()
};

export default apiService;
