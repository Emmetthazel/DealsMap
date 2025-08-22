import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DealsList from '../components/DealsList';
import DealForm from '../components/DealForm';
import BusinessForm from '../components/BusinessForm';
import DealService from '../services/DealService';

const DealsDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-deals');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [viewingDeal, setViewingDeal] = useState(null);
  const [viewingDealLoading, setViewingDealLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Function to refresh deals list
  const refreshDeals = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Function to force refresh all tabs
  const forceRefreshAllTabs = () => {
    setForceRefresh(prev => prev + 1);
  };

  // Handle form submission
  const handleDealSubmit = () => {
    setShowCreateForm(false);
    setEditingDeal(null);
    
    // If we're on the create route, navigate back to deals management
    if (location.pathname === '/dashboard/deals/create') {
      navigate('/dashboard/deals');
    }
    
    // Force refresh all tabs to show updated deals list
    forceRefreshAllTabs();
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingDeal(null);
    
    // If we're on the create route, navigate back to deals management
    if (location.pathname === '/dashboard/deals/create') {
      navigate('/dashboard/deals');
    }
  };

  // Handle deal details close
  const handleDealDetailsClose = () => {
    setViewingDeal(null);
  };

  // Handle business form success
  const handleBusinessFormSuccess = (business) => {
    setShowBusinessForm(false);
    
    // If we're on the create route, navigate back to deals management
    if (location.pathname === '/dashboard/deals/create') {
      navigate('/dashboard/deals');
    }
    
    // Force refresh all tabs to show updated business data
    forceRefreshAllTabs();
  };

  // Handle business form cancel
  const handleBusinessFormCancel = () => {
    setShowBusinessForm(false);
    
    // If we're on the create route, navigate back to deals management
    if (location.pathname === '/dashboard/deals/create') {
      navigate('/dashboard/deals');
    }
  };

  // Handle edit deal
  const handleEditDeal = (dealData) => {
    setEditingDeal(dealData);
    setShowCreateForm(true);
  };

  // Handle view deal details
  const handleViewDeal = async (dealData) => {
    console.log('handleViewDeal called with deal data:', dealData);
    console.log('Deal fields available:', Object.keys(dealData));
    console.log('Description:', dealData.description);
    console.log('Max uses:', dealData.max_uses);
    
    try {
      setViewingDealLoading(true);
      // Fetch the complete deal data to ensure all fields are populated
      const completeDealData = await DealService.getDealById(dealData.id);
      console.log('Complete deal data for viewing:', completeDealData);
      console.log('Complete deal fields:', Object.keys(completeDealData));
      setViewingDeal(completeDealData);
    } catch (error) {
      console.error('Error fetching complete deal data:', error);
      // Fallback to the original deal data if fetch fails
      setViewingDeal(dealData);
    } finally {
      setViewingDealLoading(false);
    }
  };

  // Handle delete deal
  const handleDeleteDeal = async (dealId) => {
    if (window.confirm('Are you sure you want to deactivate this deal? It will no longer be visible to customers but can be reactivated later.')) {
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
          // Show success message for deactivation
          alert('Deal deactivated successfully! It will no longer be visible to customers.');
          // Force refresh all tabs to show updated deal status
          forceRefreshAllTabs();
        } else {
          alert('Failed to deactivate deal. Please try again.');
        }
      } catch (error) {
        console.error('Error deactivating deal:', error);
        alert('An error occurred while deactivating the deal. Please try again.');
      }
    }
  };

  // Handle reactivate deal
  const handleReactivateDeal = async (dealId) => {
    try {
      const storageType = localStorage.getItem('auth_storage_type');
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const token = storage.getItem('access_token');
      
      const response = await fetch(`/api/deals/${dealId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: true
        }),
      });

      if (response.ok) {
        // Show success message for reactivation
        alert('Deal reactivated successfully! It is now visible to customers again.');
        // Force refresh all tabs to show updated deal status
        forceRefreshAllTabs();
      } else {
        alert('Failed to reactivate deal. Please try again.');
      }
    } catch (error) {
      console.error('Error reactivating deal:', error);
      alert('An error occurred while reactivating the deal. Please try again.');
    }
  };

  // Check if we're editing a deal from URL
  React.useEffect(() => {
    console.log('Location changed:', location.pathname);
    const fetchDealForEdit = async () => {
      const pathParts = location.pathname.split('/');
      console.log('Path parts:', pathParts);
      
      // Check if we're on the create deals route
      if (pathParts.includes('create') && pathParts.includes('deals')) {
        console.log('On create deals route, showing create form');
        setShowCreateForm(true);
        setEditingDeal(null);
        setViewingDeal(null);
        return;
      }
      
      // If we're on the main deals route (not create), hide the create form
      if (pathParts.includes('deals') && !pathParts.includes('create') && !pathParts.includes('edit')) {
        console.log('On main deals route, hiding create form');
        setShowCreateForm(false);
        setEditingDeal(null);
        setViewingDeal(null);
        return;
      }
      
      // Check if we're editing a deal from URL
      if (pathParts.includes('edit') && pathParts.includes('deals')) {
        const dealId = pathParts[pathParts.length - 2];
        // Fetch deal data and show edit form
        console.log('Fetching deal for edit:', dealId);
        console.log('About to call DealService.getDealById...');
        try {
          const dealData = await DealService.getDealById(dealId);
          console.log('Edit deal data received:', dealData);
          setEditingDeal(dealData);
          setShowCreateForm(true);
        } catch (error) {
          console.error('Error fetching deal for edit:', error);
          console.error('Error details:', error.message, error.stack);
          // Silent error handling
        }
      }
    };
    
    fetchDealForEdit();
  }, [location.pathname]);



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
              {editingDeal ? 'Back to Dashboard' : 'Back to Deals Management'}
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

  if (showBusinessForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={handleBusinessFormCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Deals Management
            </button>
          </div>
          <BusinessForm
            onSuccess={handleBusinessFormSuccess}
            onCancel={handleBusinessFormCancel}
          />
        </div>
      </div>
    );
  }

  if (viewingDeal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={handleDealDetailsClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Deals Management
            </button>
          </div>
          
          {/* Deal Details View */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {viewingDealLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading deal details...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{viewingDeal.title}</h1>
                      <p className="text-lg text-gray-600 mt-2">{viewingDeal.business_name}</p>
                      <p className="text-sm text-gray-500 mt-1">{viewingDeal.category_name}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      viewingDeal.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingDeal.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700">
                        {viewingDeal.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Original Price:</span>
                          <span className="text-gray-900 font-medium">
                            {viewingDeal.original_price ? `$${viewingDeal.original_price}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deal Price:</span>
                          <span className="text-green-600 font-bold text-lg">
                            {viewingDeal.deal_price ? `$${viewingDeal.deal_price}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="text-blue-600 font-medium">
                            {viewingDeal.discount_percentage ? `${viewingDeal.discount_percentage}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                        <p className="text-gray-900">
                          {viewingDeal.start_date ? new Date(viewingDeal.start_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">End Date</h4>
                        <p className="text-gray-900">
                          {viewingDeal.end_date ? new Date(viewingDeal.end_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Max Uses</h4>
                        <p className="text-gray-900">
                          {viewingDeal.max_uses || 'Unlimited'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Usage Information */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Current Uses</h4>
                          <p className="text-gray-900">
                            {viewingDeal.current_uses !== undefined ? viewingDeal.current_uses : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Remaining Uses</h4>
                          <p className="text-gray-900">
                            {viewingDeal.max_uses && viewingDeal.current_uses !== undefined 
                              ? Math.max(0, viewingDeal.max_uses - viewingDeal.current_uses)
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {viewingDeal.conditions && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Terms & Conditions</h4>
                        <p className="text-gray-700 text-sm">{viewingDeal.conditions}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Deals</h1>
                <p className="mt-2 text-gray-600">Créez et gérez vos deals et établissements</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBusinessForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Créer un établissement
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Créer un deal
                </button>
              </div>
            </div>
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
              onClick={() => setActiveTab('business')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestion Établissement
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
          <div className="flex items-center justify-between">
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
        </div>

        {/* Tab Content */}
        {activeTab === 'my-deals' && (
          <DealsList
            showMyDeals={true}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
            onViewDeal={handleViewDeal}
            refreshKey={refreshKey}
            onReactivateDeal={handleReactivateDeal}
            forceRefresh={forceRefresh}
          />
        )}
        
        {activeTab === 'business' && (
          <BusinessForm
            onSuccess={handleBusinessFormSuccess}
            onCancel={handleBusinessFormCancel}
          />
        )}
        
        {activeTab === 'nearby' && (
          <DealsList
            showNearby={true}
            initialFilters={{ radius: 10 }}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
            onViewDeal={handleViewDeal}
            refreshKey={refreshKey}
            onReactivateDeal={handleReactivateDeal}
            forceRefresh={forceRefresh}
          />
        )}
        
        {activeTab === 'all-deals' && (
          <DealsList
            showMyDeals={false}
            showNearby={false}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
            onViewDeal={handleViewDeal}
            refreshKey={refreshKey}
            onReactivateDeal={handleReactivateDeal}
            forceRefresh={forceRefresh}
          />
        )}
      </div>
    </div>
  );
};

export default DealsDashboard;
