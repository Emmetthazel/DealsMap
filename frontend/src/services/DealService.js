import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const STORAGE_TYPE_KEY = 'auth_storage_type';

const getStorage = () => {
  const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
  return storageType === 'local' ? localStorage : sessionStorage;
};

const getAccessToken = () => {
  const storage = getStorage();
  return storage.getItem(ACCESS_TOKEN_KEY);
};

const dealAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

dealAPI.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

dealAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getStorage().getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await dealAPI.post('/auth/token/refresh/', { refresh: refreshToken });
          const { access } = response.data;
          const rememberMe = localStorage.getItem(STORAGE_TYPE_KEY) === 'local';
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(ACCESS_TOKEN_KEY, access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return dealAPI(originalRequest);
        }
      } catch (refreshError) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class DealService {
  static async getDeals(filters = {}, page = 1, pageSize = 10) {
    try {
      // Ne garder que les filtres non vides
      const params = { page, page_size: pageSize };
      if (filters.category) params.category = filters.category;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
  console.log('[DealService] Appel API /deals/ avec params:', JSON.stringify(params));
      const response = await dealAPI.get('/deals/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getDeal(dealId) {
    try {
      const response = await dealAPI.get(`/deals/${dealId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createDeal(dealData, imageFile = null) {
    try {
      const formData = new FormData();
      Object.keys(dealData).forEach(key => {
        if (dealData[key] !== null && dealData[key] !== undefined) {
          formData.append(key, dealData[key]);
        }
      });
      if (imageFile) {
        formData.append('image', imageFile);
      }
      const response = await dealAPI.post('/deals/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateDeal(dealId, dealData, imageFile = null) {
    try {
      const formData = new FormData();
      Object.keys(dealData).forEach(key => {
        if (dealData[key] !== null && dealData[key] !== undefined) {
          formData.append(key, dealData[key]);
        }
      });
      if (imageFile) {
        formData.append('image', imageFile);
      }
      const response = await dealAPI.put(`/deals/${dealId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deleteDeal(dealId) {
    try {
      const response = await dealAPI.delete(`/deals/${dealId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validation côté client
  static validateDeal(deal) {
    const errors = {};
    if (!deal.title || deal.title.length < 3) {
      errors.title = 'Le titre est requis (min 3 caractères)';
    }
    if (!deal.original_price || isNaN(deal.original_price) || deal.original_price <= 0) {
      errors.original_price = 'Prix original invalide';
    }
    if (!deal.deal_price || isNaN(deal.deal_price) || deal.deal_price <= 0) {
      errors.deal_price = 'Prix de l’offre invalide';
    }
    if (Number(deal.deal_price) >= Number(deal.original_price)) {
      errors.deal_price = 'Le prix de l’offre doit être inférieur au prix original';
    }
    if (!deal.start_date || !deal.end_date) {
      errors.dates = 'Les dates de début et de fin sont requises';
    } else {
      const start = new Date(deal.start_date);
      const end = new Date(deal.end_date);
      if (end <= start) {
        errors.dates = 'La date de fin doit être après la date de début';
      }
      const maxDuration = 28 * 24 * 60 * 60 * 1000; // 4 semaines
      if (end - start > maxDuration) {
        errors.dates = 'La durée maximale d’un deal est de 4 semaines';
      }
    }
    if (!deal.max_uses || isNaN(deal.max_uses) || deal.max_uses <= 0) {
      errors.max_uses = 'Le nombre d’utilisations max est requis';
    }
    return errors;
  }

  static handleError(error) {
    if (error.response) {
      const { data, status } = error.response;
      if (status === 400 && data) {
        const errorMessages = [];
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            errorMessages.push(...data[key]);
          } else {
            errorMessages.push(data[key]);
          }
        });
        return new Error(errorMessages.join(', '));
      }
      if (status === 401) return new Error('Authentification requise');
      if (status === 403) return new Error('Accès refusé');
      if (status === 404) return new Error('Deal introuvable');
      if (status >= 500) return new Error('Erreur serveur. Réessayez plus tard.');
      return new Error(data?.message || 'Une erreur est survenue');
    }
    if (error.request) {
      return new Error('Erreur réseau. Vérifiez votre connexion.');
    }
    return new Error(error.message || 'Erreur inattendue');
  }
}

export default DealService;
