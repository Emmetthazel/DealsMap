// services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/', 
  timeout: 10000,
});

export const fetchCategories = async () => {
  const res = await API.get('categories/');
  return res.data;
};

export default API;
