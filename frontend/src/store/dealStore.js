import { create } from 'zustand';
import DealService from '../services/DealService';

const useDealStore = create((set, get) => ({
  deals: [],
  loading: false,
  error: null,

  fetchDeals: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await DealService.getDeals(filters);
      set({ deals: data.results || data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Erreur lors du chargement des offres', loading: false });
    }
  },

  addDeal: (deal) => set((state) => ({ deals: [deal, ...state.deals] })),
  updateDeal: (updatedDeal) => set((state) => ({
    deals: state.deals.map(d => d.id === updatedDeal.id ? updatedDeal : d)
  })),
  removeDeal: (dealId) => set((state) => ({
    deals: state.deals.filter(d => d.id !== dealId)
  })),
}));

export default useDealStore;
