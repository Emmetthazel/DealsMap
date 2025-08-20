import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DealsList from '../components/DealsList';
import DealForm from '../components/DealForm';

const DealsDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-deals');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const location = useLocation();

  // Handle form submission
  const handleDealSubmit = () => {
    setShowCreateForm(false);
    setEditingDeal(null);
    // Refresh the deals list
    window.location.reload();
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingDeal(null);
  };

  // Handle edit deal
  const handleEditDeal = (dealData) => {
    setEditingDeal(dealData);
    setShowCreateForm(true);
  };

  // Handle delete deal
  const handleDeleteDeal = async (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        const storageType = localStorage.getItem('auth_storage_type');
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        const token = storage.getItem('access_token');
        
        const response = await fetch(`/api/deals/${dealId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Refresh the deals list
          window.location.reload();
        } else {
          alert('Failed to delete deal');
        }
      } catch (error) {
        console.error('Error deleting deal:', error);
        alert('Error deleting deal');
      }
    }
  };

  // Check if we're editing a deal from URL
  React.useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts.includes('edit') && pathParts[pathParts.length - 2] === 'deals') {
      const dealId = pathParts[pathParts.length - 1];
      // Fetch deal data and show edit form
      const storageType = localStorage.getItem('auth_storage_type');
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const token = storage.getItem('access_token');
      
      fetch(`/api/deals/${dealId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(dealData => {
          setEditingDeal(dealData);
          setShowCreateForm(true);
        })
        .catch(error => {
          console.error('Error fetching deal:', error);
        });
    }
  }, [location]);

  // Debug: Check authentication state
  React.useEffect(() => {
    const storageType = localStorage.getItem('auth_storage_type');
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const token = storage.getItem('access_token');
    
    console.log('🔍 DealsDashboard - Storage type:', storageType);
    console.log('🔍 DealsDashboard - Token exists:', !!token);
    console.log('🔍 DealsDashboard - Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
  }, []);

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={handleFormCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          <DealForm
            deal={editingDeal}
            onSubmit={handleDealSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deals Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your promotional deals and track performance
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Deal
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-deals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-deals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Deals
            </button>
            <button
              onClick={() => setActiveTab('nearby')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nearby'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Nearby Deals
            </button>
            <button
              onClick={() => setActiveTab('all-deals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all-deals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Deals
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message for First-Time Users */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">
                Bienvenue dans votre tableau de bord des deals !
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Commencez par créer votre premier deal ou explorez les fonctionnalités disponibles.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-deals' && (
          <DealsList
            showMyDeals={true}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
          />
        )}
        
        {activeTab === 'nearby' && (
          <DealsList
            showNearby={true}
            initialFilters={{ radius: 10 }}
          />
        )}
        
        {activeTab === 'all-deals' && (
          <DealsList
            showMyDeals={false}
            showNearby={false}
          />
        )}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-8 right-8">
        <div className="relative group">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-110"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Create New Deal
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsDashboard;
