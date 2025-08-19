// Service pour récupérer les deals avec filtres
import axios from 'axios';

export const fetchDeals = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = `/api/deals/${params ? '?' + params : ''}`;
  const response = await axios.get(url);
  // Ensure the result is always an array
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (Array.isArray(response.data.deals)) {
    return response.data.deals;
  } else {
    return [];
  }
};
