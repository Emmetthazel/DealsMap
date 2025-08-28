import { create } from 'zustand';
import { fetchCategories } from '../services/categoryService';

export const useCategoryStore = create((set) => ({
  categories: [],
  loading: false,
  error: null,
  fetchAllCategories: async () => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Fetching categories...');
      
      // Force fresh fetch from API (ignore cache for now)
      console.log('🌐 Fetching categories from API...');
      const data = await fetchCategories();
      console.log('✅ Categories fetched from API:', data);
      
      // Update localStorage with fresh data
      localStorage.setItem('categories', JSON.stringify(data));
      set({ categories: data, loading: false });
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      set({ error: err.message, loading: false });
    }
  },
  clearCacheAndRefresh: async () => {
    console.log('🗑️ Clearing categories cache...');
    localStorage.removeItem('categories');
    set({ categories: [], loading: false, error: null });
    // Fetch fresh data
    const store = useCategoryStore.getState();
    await store.fetchAllCategories();
  },
}));
