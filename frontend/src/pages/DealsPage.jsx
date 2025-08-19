import React, { useState } from 'react';
import DealsFilter from '../components/DealsFilter';
import DealsList from '../components/DealsList';

const DealsPage = () => {
  const [filters, setFilters] = useState({});

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Deals</h2>
      <DealsFilter onChange={setFilters} />
      <DealsList filters={filters} />
    </div>
  );
};

export default DealsPage;
