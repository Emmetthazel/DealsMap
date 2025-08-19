import React, { useState } from 'react';

const DealsFilter = ({ onChange }) => {
  const [filters, setFilters] = useState({ category: '', distance: '', search: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };

  return (
    <form className="flex gap-2 mb-4">
      <input
        type="text"
        name="search"
        placeholder="Recherche..."
        value={filters.search}
        onChange={handleChange}
        className="border rounded px-2 py-1"
      />
      <input
        type="text"
        name="category"
        placeholder="Catégorie"
        value={filters.category}
        onChange={handleChange}
        className="border rounded px-2 py-1"
      />
      <input
        type="number"
        name="distance"
        placeholder="Distance (km)"
        value={filters.distance}
        onChange={handleChange}
        className="border rounded px-2 py-1"
      />
    </form>
  );
};

export default DealsFilter;
