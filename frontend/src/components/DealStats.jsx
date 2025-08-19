import React from 'react';

const DealStats = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="deal-stats">
      <div>Ventes : {stats.sales}</div>
      <div>Vues : {stats.views}</div>
      <div>Conversions : {stats.conversions}</div>
    </div>
  );
};

export default DealStats;
