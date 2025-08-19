import React, { useEffect, useState } from 'react';
import { fetchDeals } from '../services/deals';

const DealsList = ({ filters }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchDeals(filters)
      .then(setDeals)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error.message}</div>;

  return (
    <div>
      {deals.length === 0 ? (
        <div>Aucun deal trouvé.</div>
      ) : (
        <ul>
          {deals.map((deal) => (
            <li key={deal.id}>{deal.title} - {deal.price}€</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DealsList;
