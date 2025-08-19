import React, { useEffect, useState } from 'react';
import useDealStore from '../store/dealStore';
import DealStatsCard from '../components/DealStatsCard';
import { useCategoryStore } from '../store/categoryStore';

const DealsListPage = () => {
  const { deals, fetchDeals, loading, error } = useDealStore();
  const [filters, setFilters] = useState({ category: '', min_price: '', max_price: '' });
  const { categories, fetchAllCategories, loading: loadingCategories } = useCategoryStore();

  useEffect(() => {
    fetchAllCategories();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchDeals(filters);
    // eslint-disable-next-line
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Liste des offres</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          disabled={loadingCategories}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="number"
          name="min_price"
          value={filters.min_price}
          onChange={handleChange}
          placeholder="Prix min"
          className="border px-3 py-2 rounded"
        />
        <input
          type="number"
          name="max_price"
          value={filters.max_price}
          onChange={handleChange}
          placeholder="Prix max"
          className="border px-3 py-2 rounded"
        />
      </div>
      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deals.map((deal) => (
          <DealStatsCard key={deal.id} deal={deal} />
        ))}
      </div>
      {deals.length === 0 && !loading && <p>Aucune offre trouvée.</p>}
    </div>
  );
};

export default DealsListPage;
