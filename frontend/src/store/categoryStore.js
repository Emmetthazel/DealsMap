import { create } from 'zustand';
import { fetchCategories } from '../services/categoryService';

export const useCategoryStore = create((set) => ({
  categories: [],
  loading: false,
  error: null,
  fetchAllCategories: async () => {
    set({ loading: true, error: null });
    try {
      const cached = localStorage.getItem('categories');
      if (cached) {
        set({ categories: JSON.parse(cached), loading: false });
        return;
      }

      const data = await fetchCategories();
      localStorage.setItem('categories', JSON.stringify(data));
      set({ categories: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));
