import React from 'react';
import { BarChart2, Eye, ShoppingCart, TrendingUp } from 'lucide-react';

const DealStatsCard = ({ deal }) => {
  return (
    <div className="border rounded-lg p-4 bg-white shadow relative">
      <h2 className="font-semibold text-lg mb-2">{deal.title}</h2>
      <div className="flex flex-col gap-2 mb-2">
        <span className="text-gray-700">Prix original : <span className="font-bold">{deal.original_price} MAD</span></span>
        <span className="text-blue-700">Prix deal : <span className="font-bold">{deal.deal_price} MAD</span></span>
        <span className="text-gray-500 text-sm">Catégorie : {deal.category_name || deal.category}</span>
      </div>
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex flex-col items-center flex-1">
          <ShoppingCart className="w-5 h-5 text-green-600 mb-1" />
          <span className="font-bold text-lg">{deal.sales ?? 0}</span>
          <span className="text-gray-500">Ventes</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Eye className="w-5 h-5 text-blue-500 mb-1" />
          <span className="font-bold text-lg">{deal.views ?? 0}</span>
          <span className="text-gray-500">Vues</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <TrendingUp className="w-5 h-5 text-orange-500 mb-1" />
          <span className="font-bold text-lg">{deal.conversions ?? 0}</span>
          <span className="text-gray-500">Conversions</span>
        </div>
      </div>
      {/* Graphique miniature ou barre de progression possible ici */}
      {/* <div className="mt-4"><BarChart2 className="w-6 h-6 text-gray-400" /></div> */}
    </div>
  );
};

export default DealStatsCard;
