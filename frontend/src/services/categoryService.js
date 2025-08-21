// services/categoryService.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/', 
  timeout: 10000,
});

// Add authentication header to requests
API.interceptors.request.use((config) => {
  const storageType = localStorage.getItem('auth_storage_type');
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  const token = storage.getItem('access_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const fetchCategories = async (queryParams = '') => {
  try {
    const res = await API.get(`categories/${queryParams}`);
    return res.data;
  } catch (error) {
    console.error('Category service error:', error);
    throw error;
  }
};

export default API;
