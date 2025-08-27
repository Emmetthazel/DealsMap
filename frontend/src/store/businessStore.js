import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const useBusinessStore = create(
  devtools(
    (set, get) => ({
      // State
      businesses: [],
      selectedBusiness: null,
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasMore: true,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch all businesses with optional filters
      fetchBusinesses: async (filters = {}, page = 1) => {
        try {
          set({ isLoading: true, error: null });
          
          const params = new URLSearchParams();
          
          // Add filter parameters
          if (filters.category) params.append('category', filters.category);
          if (filters.city) params.append('city', filters.city);
          if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
          if (filters.minRating) params.append('min_rating', filters.minRating);
          if (filters.maxRating) params.append('max_rating', filters.maxRating);
          if (filters.hasDeals) params.append('has_deals', filters.hasDeals);
          if (filters.openNow) params.append('open_now', filters.openNow);
          if (filters.distance) params.append('distance', filters.distance);
          if (page > 1) params.append('page', page);
          
          const response = await axios.get(`${API_BASE_URL}/businesses/?${params.toString()}`);
          
          if (page === 1) {
            set({ 
              businesses: response.data.results || response.data,
              currentPage: page,
              totalPages: response.data.count ? Math.ceil(response.data.count / 10) : 1,
              hasMore: response.data.next ? true : false
            });
          } else {
            set(state => ({
              businesses: [...state.businesses, ...(response.data.results || response.data)],
              currentPage: page,
              hasMore: response.data.next ? true : false
            }));
          }
        } catch (error) {
          set({ error: error.message });
          console.error('Error fetching businesses:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch business by ID
      fetchBusinessById: async (businessId) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.get(`${API_BASE_URL}/businesses/${businessId}/`);
          const business = response.data;
          
          set({ selectedBusiness: business });
          
          // Update in businesses list if exists
          set(state => ({
            businesses: state.businesses.map(b => 
              b.id === businessId ? business : b
            )
          }));
          
          return business;
        } catch (error) {
          set({ error: error.message });
          console.error('Error fetching business:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Create new business
      createBusiness: async (businessData) => {
        try {
          set({ isLoading: true, error: null });
          
          const token = localStorage.getItem('access_token');
          const response = await axios.post(`${API_BASE_URL}/businesses/`, businessData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const newBusiness = response.data;
          
          set(state => ({
            businesses: [newBusiness, ...state.businesses]
          }));
          
          return newBusiness;
        } catch (error) {
          set({ error: error.message });
          console.error('Error creating business:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Update business
      updateBusiness: async (businessId, businessData) => {
        try {
          set({ isLoading: true, error: null });
          
          const token = localStorage.getItem('access_token');
          const response = await axios.put(`${API_BASE_URL}/businesses/${businessId}/`, businessData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const updatedBusiness = response.data;
          
          set(state => ({
            businesses: state.businesses.map(b => 
              b.id === businessId ? updatedBusiness : b
            ),
            selectedBusiness: state.selectedBusiness?.id === businessId ? updatedBusiness : state.selectedBusiness
          }));
          
          return updatedBusiness;
        } catch (error) {
          set({ error: error.message });
          console.error('Error updating business:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Delete business
      deleteBusiness: async (businessId) => {
        try {
          set({ isLoading: true, error: null });
          
          const token = localStorage.getItem('access_token');
          await axios.delete(`${API_BASE_URL}/businesses/${businessId}/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          set(state => ({
            businesses: state.businesses.filter(b => b.id !== businessId),
            selectedBusiness: state.selectedBusiness?.id === businessId ? null : state.selectedBusiness
          }));
          
          return true;
        } catch (error) {
          set({ error: error.message });
          console.error('Error deleting business:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Search businesses
      searchBusinesses: async (query, filters = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          const params = new URLSearchParams();
          params.append('search', query);
          
          // Add filter parameters
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.append(key, value);
            }
          });
          
          const response = await axios.get(`${API_BASE_URL}/businesses/?${params.toString()}`);
          
          set({ 
            businesses: response.data.results || response.data,
            currentPage: 1,
            totalPages: response.data.count ? Math.ceil(response.data.count / 10) : 1,
            hasMore: response.data.next ? true : false
          });
        } catch (error) {
          set({ error: error.message });
          console.error('Error searching businesses:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Get businesses by category
      getBusinessesByCategory: async (categoryId) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.get(`${API_BASE_URL}/businesses/?category=${categoryId}`);
          
          set({ 
            businesses: response.data.results || response.data,
            currentPage: 1,
            totalPages: response.data.count ? Math.ceil(response.data.count / 10) : 1,
            hasMore: response.data.next ? true : false
          });
        } catch (error) {
          set({ error: error.message });
          console.error('Error fetching businesses by category:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Get businesses near location
      getBusinessesNearLocation: async (latitude, longitude, radius = 10) => {
        try {
          set({ isLoading: true, error: null });
          
          const params = new URLSearchParams();
          params.append('lat', latitude);
          params.append('lng', longitude);
          params.append('radius', radius);
          
          const response = await axios.get(`${API_BASE_URL}/businesses/?${params.toString()}`);
          
          set({ 
            businesses: response.data.results || response.data,
            currentPage: 1,
            totalPages: response.data.count ? Math.ceil(response.data.count / 10) : 1,
            hasMore: response.data.next ? true : false
          });
        } catch (error) {
          set({ error: error.message });
          console.error('Error fetching businesses near location:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Clear businesses
      clearBusinesses: () => {
        set({
          businesses: [],
          selectedBusiness: null,
          currentPage: 1,
          totalPages: 1,
          hasMore: true
        });
      },

      // Set selected business
      setSelectedBusiness: (business) => {
        set({ selectedBusiness: business });
      },

      // Get business by ID from current state
      getBusinessById: (businessId) => {
        const state = get();
        return state.businesses.find(b => b.id === businessId);
      },

      // Check if business has deals
      businessHasDeals: (businessId) => {
        const state = get();
        const business = state.businesses.find(b => b.id === businessId);
        return business?.deals_count > 0;
      }
    })
  )
);

export default useBusinessStore;
