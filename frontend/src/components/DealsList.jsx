import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DealService from '../services/DealService';
import { toast } from 'react-hot-toast';
import useDealsStore from '../store/dealsStore';

const DealsList = ({ showMyDeals = false, showNearby = false, initialFilters = {} }) => {
  const dealsStore = useDealsStore();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    min_price: '',
    max_price: '',
    min_discount: '',
    status: '',
    search: '',
    ...initialFilters
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });
  const [categories, setCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Define all callback functions first
  const loadCategories = async () => {
    try {
      const categoriesData = await DealService.getDealCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Loading deals...', { showMyDeals, showNearby, filters });

    try {
      let dealsData;

      if (showNearby && userLocation) {
        console.log('📍 Loading nearby deals...');
        dealsData = await DealService.getNearbyDeals(
          userLocation.latitude,
          userLocation.longitude,
          filters.radius || 10,
          filters.category
        );
      } else if (showMyDeals) {
        console.log('👤 Loading my deals...');
        dealsData = await DealService.getMyDeals(filters.status);
      } else {
        console.log('🔍 Loading all deals...');
        dealsData = await DealService.searchDeals({
          ...filters,
          page: pagination.current_page
        });
      }
      
      console.log('✅ Deals loaded:', dealsData);

      if (dealsData.results) {
        setDeals(dealsData.results);
        setPagination({
          count: dealsData.count || 0,
          next: dealsData.next,
          previous: dealsData.previous,
          current_page: pagination.current_page
        });
      } else {
        setDeals(dealsData);
        setPagination({
          count: dealsData.length || 0,
          next: null,
          previous: null,
          current_page: 1
        });
      }
    } catch (error) {
      console.error('❌ Error loading deals:', error);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showNearby, showMyDeals, userLocation, filters, pagination.current_page]);

  const loadNearbyDeals = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError(null);

    try {
      const dealsData = await DealService.getNearbyDeals(
        userLocation.latitude,
        userLocation.longitude,
        filters.radius || 10,
        filters.category
      );

      if (dealsData.results) {
        setDeals(dealsData.results);
        setPagination({
          count: dealsData.count || 0,
          next: dealsData.next,
          previous: null,
          current_page: 1
        });
      } else {
        setDeals(dealsData);
        setPagination({
          count: dealsData.length || 0,
          next: null,
          previous: null,
          current_page: 1
        });
      }
    } catch (error) {
      console.error('Error loading nearby deals:', error);
      setError('Failed to load nearby deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters.radius, filters.category]);

  // Move useEffect hooks to after all functions are defined



  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDeals();
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const getDealStats = () => {
    if (!deals.length) return {};

    const stats = {
      total: deals.length,
      active: 0,
      upcoming: 0,
      expired: 0,
      totalSavings: 0,
      averageDiscount: 0
    };

    let totalDiscount = 0;

    deals.forEach(deal => {
      const status = DealService.getDealStatus(deal);
      stats[status]++;
      
      if (deal.original_price && deal.deal_price) {
        const savings = parseFloat(deal.original_price) - parseFloat(deal.deal_price);
        stats.totalSavings += savings;
        totalDiscount += parseFloat(deal.discount_percentage || 0);
      }
    });

    stats.averageDiscount = totalDiscount / deals.length;

    return stats;
  };

  const stats = getDealStats();

  // useEffect hooks - placed here after all functions are defined
  useEffect(() => {
    loadCategories();
    if (showNearby) {
      getUserLocation();
    }
  }, [showNearby]);

  useEffect(() => {
    if (showNearby) {
      loadNearbyDeals();
    } else {
      loadDeals();
    }
  }, [showNearby, loadNearbyDeals, loadDeals]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  if (loading && deals.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des deals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {!showNearby && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Deals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Discount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageDiscount ? `${stats.averageDiscount.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search deals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                placeholder="1000.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Min Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Discount %</label>
              <input
                type="number"
                value={filters.min_discount}
                onChange={(e) => handleFilterChange('min_discount', e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status (for my deals) */}
            {showMyDeals && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            )}

            {/* Radius (for nearby search) */}
            {showNearby && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
                <select
                  value={filters.radius || 10}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            )}

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Deals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {showMyDeals ? 'My Deals' : showNearby ? 'Nearby Deals' : 'All Deals'}
          </h3>
          <p className="text-sm text-gray-500">
            {pagination.count} deals found
          </p>
        </div>

                 {deals.length === 0 ? (
           <div className="text-center py-12">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             <h3 className="mt-2 text-sm font-medium text-gray-900">
               {showMyDeals ? 'Aucun deal trouvé' : 'Aucun deal disponible'}
             </h3>
             <p className="mt-1 text-sm text-gray-500">
               {showMyDeals 
                 ? 'Vous n\'avez pas encore créé de deals. Commencez par en créer un !'
                 : 'Aucun deal ne correspond à vos critères de recherche.'
               }
             </p>
             {showMyDeals && (
               <div className="mt-6">
                 <button
                   onClick={() => window.location.href = '/dashboard/deals/create'}
                   className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                   </svg>
                   Créer mon premier deal
                 </button>
               </div>
             )}
           </div>
                 ) : (
           <div className="divide-y divide-gray-200">
             {deals.map((deal) => (
               <DealCard 
                 key={deal.id} 
                 deal={deal} 
                 showMyDeals={showMyDeals}
                 dealsStore={dealsStore}
                 loadDeals={loadDeals}
               />
             ))}
           </div>
         )}
      </div>

      {/* Pagination */}
      {pagination.count > 0 && (pagination.next || pagination.previous) && (
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.current_page} of {Math.ceil(pagination.count / 10)}
            </div>
            <div className="flex space-x-2">
              {pagination.previous && (
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Previous
                </button>
              )}
              {pagination.next && (
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Deal Card Component
const DealCard = ({ deal, showMyDeals, dealsStore, loadDeals }) => {
  const status = DealService.getDealStatus(deal);
  const statusColor = DealService.getStatusColor(status);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-start space-x-4">
        {/* Deal Image */}
        <div className="flex-shrink-0">
          {deal.image ? (
            <img
              src={deal.image}
              alt={deal.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Deal Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 truncate">
                {deal.title}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {deal.business_name} • {deal.category_name}
              </p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {deal.description}
              </p>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {/* Pricing and Details */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500 line-through">
                  {DealService.formatPrice(deal.original_price)}
                </span>
                <span className="ml-2 text-lg font-semibold text-green-600">
                  {DealService.formatPrice(deal.deal_price)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {deal.discount_percentage}% off
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <div>Expires: {DealService.formatDate(deal.end_date)}</div>
              {showMyDeals && (
                <div>Uses: {deal.current_uses}/{deal.max_uses}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center space-x-3">
            {showMyDeals ? (
              <>
                <Link
                  to={`/dashboard/deals/${deal.id}/edit`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce deal ?')) {
                      dealsStore.deleteDeal(deal.id).then(() => {
                        toast.success('Deal supprimé avec succès');
                        if (showMyDeals) {
                          loadDeals();
                        }
                      }).catch((error) => {
                        toast.error('Erreur lors de la suppression du deal');
                        console.error('Delete deal error:', error);
                      });
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </>
            ) : (
              <Link
                to={`/deals/${deal.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsList;
