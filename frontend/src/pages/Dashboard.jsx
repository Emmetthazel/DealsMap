import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  console.log('Dashboard render');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="mt-2 text-gray-600">Bienvenue sur votre espace DealsMap</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard/deals')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Gérer mes deals
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/deals/create')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Créer un nouveau deal
                  </button>
                </div>
              </div>

              {/* Statistics Preview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Statistiques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Deals actifs:</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Vues totales:</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Conversions:</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Activité récente</h3>
                <div className="text-sm text-purple-700">
                  <p>Connectez-vous à la gestion des deals pour voir votre activité récente.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/dashboard/deals')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Accéder à la gestion des deals →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
