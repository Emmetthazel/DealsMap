import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import DealService from '../services/DealService';

const useDealsStore = create(
  persist(
    (set, get) => ({
      // State
      deals: [],
      myDeals: [],
      nearbyDeals: [],
      categories: [],
      loading: false,
      error: null,
      filters: {
        category: '',
        min_price: '',
        max_price: '',
        min_discount: '',
        status: '',
        search: '',
        radius: 10
      },
      pagination: {
        count: 0,
        next: null,
        previous: null,
        current_page: 1
      },
      cache: new Map(), // In-memory cache for API responses
      lastFetch: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Set filters
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, current_page: 1 }
        }));
      },

      // Reset filters
      resetFilters: () => {
        set((state) => ({
          filters: {
            category: '',
            min_price: '',
            max_price: '',
            min_discount: '',
            status: '',
            search: '',
            radius: 10
          },
          pagination: { ...state.pagination, current_page: 1 }
        }));
      },

      // Set pagination
      setPagination: (pagination) => set({ pagination }),

      // Cache management
      getCachedData: (key) => {
        const state = get();
        const cached = state.cache.get(key);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
          return cached.data;
        }
        return null;
      },

      setCachedData: (key, data) => {
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(key, {
            data,
            timestamp: Date.now()
          });
          return { cache: newCache };
        });
      },

      clearCache: () => set({ cache: new Map() }),

      // Fetch all deals with caching
      fetchDeals: async (filters = {}, forceRefresh = false) => {
        const state = get();
        const cacheKey = `deals_${JSON.stringify(filters)}`;
        
        // Check cache first
        if (!forceRefresh) {
          const cached = state.getCachedData(cacheKey);
          if (cached) {
            set({ deals: cached.results || cached, pagination: cached });
            return cached;
          }
        }

        try {
          set({ loading: true, error: null });
          const data = await DealService.getDeals(filters);
          
          set({ 
            deals: data.results || data,
            pagination: {
              count: data.count || data.length || 0,
              next: data.next,
              previous: data.previous,
              current_page: state.pagination.current_page
            }
          });

          // Cache the response
          state.setCachedData(cacheKey, data);
          
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Fetch nearby deals with caching
      fetchNearbyDeals: async (latitude, longitude, radius = 10, category = null, forceRefresh = false) => {
        const state = get();
        const cacheKey = `nearby_${latitude}_${longitude}_${radius}_${category}`;
        
        // Check cache first
        if (!forceRefresh) {
          const cached = state.getCachedData(cacheKey);
          if (cached) {
            set({ nearbyDeals: cached.results || cached });
            return cached;
          }
        }

        try {
          set({ loading: true, error: null });
          const data = await DealService.getNearbyDeals(latitude, longitude, radius, category);
          
          set({ nearbyDeals: data.results || data });
          
          // Cache the response
          state.setCachedData(cacheKey, data);
          
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Fetch user's deals with caching
      fetchMyDeals: async (status = null, forceRefresh = false) => {
        const state = get();
        const cacheKey = `my_deals_${status}`;
        
        // Check cache first
        if (!forceRefresh) {
          const cached = state.getCachedData(cacheKey);
          if (cached) {
            set({ myDeals: cached.results || cached });
            return cached;
          }
        }

        try {
          set({ loading: true, error: null });
          const data = await DealService.getMyDeals(status);
          
          set({ myDeals: data.results || data });
          
          // Cache the response
          state.setCachedData(cacheKey, data);
          
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Search deals with caching
      searchDeals: async (searchParams = {}, forceRefresh = false) => {
        const state = get();
        const cacheKey = `search_${JSON.stringify(searchParams)}`;
        
        // Check cache first
        if (!forceRefresh) {
          const cached = state.getCachedData(cacheKey);
          if (cached) {
            set({ 
              deals: cached.results || cached,
              pagination: {
                count: cached.count || cached.length || 0,
                next: cached.next,
                previous: cached.previous,
                current_page: state.pagination.current_page
              }
            });
            return cached;
          }
        }

        try {
          set({ loading: true, error: null });
          const data = await DealService.searchDeals(searchParams);
          
          set({ 
            deals: data.results || data,
            pagination: {
              count: data.count || data.length || 0,
              next: data.next,
              previous: data.previous,
              current_page: state.pagination.current_page
            }
          });
          
          // Cache the response
          state.setCachedData(cacheKey, data);
          
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Fetch categories with caching
      fetchCategories: async (forceRefresh = false) => {
        const state = get();
        const cacheKey = 'categories';
        
        // Check cache first
        if (!forceRefresh) {
          const cached = state.getCachedData(cacheKey);
          if (cached) {
            set({ categories: cached });
            return cached;
          }
        }

        try {
          const data = await DealService.getDealCategories();
          set({ categories: data });
          
          // Cache the response
          state.setCachedData(cacheKey, data);
          
          return data;
        } catch (error) {
          return [];
        }
      },

      // Create a new deal
      createDeal: async (dealData) => {
        try {
          set({ loading: true, error: null });
          const newDeal = await DealService.createDeal(dealData);
          
          // Add to my deals
          set((currentState) => ({
            myDeals: [newDeal, ...currentState.myDeals],
            deals: [newDeal, ...currentState.deals]
          }));
          
          // Clear cache to force refresh
          get().clearCache();
          
          return newDeal;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Update an existing deal
      updateDeal: async (id, dealData) => {
        try {
          set({ loading: true, error: null });
          const updatedDeal = await DealService.updateDeal(id, dealData);
          
          // Update in all lists
          set((currentState) => ({
            myDeals: currentState.myDeals.map(deal => 
              deal.id === id ? updatedDeal : deal
            ),
            deals: currentState.deals.map(deal => 
              deal.id === id ? updatedDeal : deal
            ),
            nearbyDeals: currentState.nearbyDeals.map(deal => 
              deal.id === id ? updatedDeal : deal
            )
          }));
          
          // Clear cache to force refresh
          get().clearCache();
          
          return updatedDeal;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Delete a deal
      deleteDeal: async (id) => {
        try {
          set({ loading: true, error: null });
          await DealService.deleteDeal(id);
          
          // Remove from all lists
          set((currentState) => ({
            myDeals: currentState.myDeals.filter(deal => deal.id !== id),
            deals: currentState.deals.filter(deal => deal.id !== id),
            nearbyDeals: currentState.nearbyDeals.filter(deal => deal.id !== id)
          }));
          
          // Clear cache to force refresh
          get().clearCache();
          
          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Get deal by ID
      getDealById: (id) => {
        const state = get();
        return state.deals.find(deal => deal.id === id) ||
               state.myDeals.find(deal => deal.id === id) ||
               state.nearbyDeals.find(deal => deal.id === id);
      },

      // Get deal statistics
      getDealStats: () => {
        const state = get();
        const deals = state.myDeals.length > 0 ? state.myDeals : state.deals;
        
        if (!deals.length) return {};

        const stats = {
          total: deals.length,
          active: 0,
          upcoming: 0,
          expired: 0,
          totalSavings: 0,
          averageDiscount: 0
        };

        let totalDiscount = 0;

        deals.forEach(deal => {
          const status = DealService.getDealStatus(deal);
          stats[status]++;
          
          if (deal.original_price && deal.deal_price) {
            const savings = parseFloat(deal.original_price) - parseFloat(deal.deal_price);
            stats.totalSavings += savings;
            totalDiscount += parseFloat(deal.discount_percentage || 0);
          }
        });

        stats.averageDiscount = totalDiscount / deals.length;

        return stats;
      },

      // Refresh all data
      refreshAll: async () => {
        const state = get();
        state.clearCache();
        
        // Refresh all data
        await Promise.all([
          state.fetchDeals(state.filters, true),
          state.fetchCategories(true),
          state.fetchMyDeals(null, true)
        ]);
      }
    }),
    {
      name: 'deals-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
);

export default useDealsStore;
