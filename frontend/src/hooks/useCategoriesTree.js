// Hooks/useCategoryTree.js
import { useEffect } from 'react';
import { useCategoryStore } from '../store/categoryStore';


export const useCategoryTree = () => {
  const {
    categories,
    loading,
    error,
    fetchAllCategories
  } = useCategoryStore();

  useEffect(() => {
    if (!categories) {
      fetchAllCategories();
    }
  }, [categories, fetchAllCategories]);

  return {
    categories,
    loading,
    error
  };
};
