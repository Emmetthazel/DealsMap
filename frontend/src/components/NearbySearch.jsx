import React, { useState, useEffect } from 'react';
import BusinessService from '../services/BusinessService.js';
import GeoService from '../services/GeoService.js';

const NearbySearch = ({ onBusinessSelect = null }) => {
  const [searchParams, setSearchParams] = useState({
    lat: '',
    lng: '',
    radius: 10,
    category: '',
    distance: '',
    rating: ''
  });
  
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Mock categories - replace with actual API call
      setCategories([
        { id: 1, name: 'Restaurant' },
        { id: 2, name: 'Café' },
        { id: 3, name: 'Retail' },
        { id: 4, name: 'Services' },
        { id: 5, name: 'Entertainment' }
      ]);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const location = await GeoService.getCurrentLocation();
      setCurrentLocation(location);
      setSearchParams(prev => ({
        ...prev,
        lat: location.lat,
        lng: location.lng
      }));
      
      // Auto-search with current location
      await searchNearbyBusinesses(location.lat, location.lng);
    } catch (error) {
      setError(`Failed to get location: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyBusinesses = async (lat, lng, page = 1) => {
    if (!lat || !lng) {
      setError('Please provide location coordinates');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const filters = {};
      if (searchParams.category) filters.category = searchParams.category;
      if (searchParams.distance) filters.distance = searchParams.distance;
      if (searchParams.rating) filters.rating = searchParams.rating;

      const response = await BusinessService.getNearbyBusinesses(
        lat,
        lng,
        searchParams.radius,
        filters,
        page,
        pagination.pageSize
      );

      setBusinesses(response.results || []);
      setPagination({
        page: response.page || page,
        pageSize: response.page_size || pagination.pageSize,
        total: response.count || 0,
        hasNext: response.next || false,
        hasPrevious: response.previous || false
      });
    } catch (error) {
      setError(`Search failed: ${error.message}`);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await searchNearbyBusinesses(searchParams.lat, searchParams.lng, 1);
  };

  const handlePageChange = async (newPage) => {
    await searchNearbyBusinesses(searchParams.lat, searchParams.lng, newPage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const BusinessCard = ({ business }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {business.image && (
          <img
            src={business.image}
            alt={business.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {business.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {business.address}, {business.city}
              </p>
              {business.category_name && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                  {business.category_name}
                </span>
              )}
            </div>
            <div className="text-right">
              {business.distance && (
                <p className="text-sm font-medium text-gray-900">
                  {GeoService.formatDistance(business.distance)}
                </p>
              )}
              {business.is_verified && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {business.opening_hours && (
                <span>🕒 {business.opening_hours.monday?.open || 'Hours N/A'}</span>
              )}
              {business.owner_name && (
                <span>👤 {business.owner_name}</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onBusinessSelect && onBusinessSelect(business)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                View Details
              </button>
              <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🔍 Search Nearby Businesses
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                name="lat"
                value={searchParams.lat}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40.7128"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                name="lng"
                value={searchParams.lng}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., -74.0060"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (km)
              </label>
              <select
                name="radius"
                value={searchParams.radius}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={searchParams.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading || (!searchParams.lat || !searchParams.lng)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📍 Use My Location
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Search Error
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {businesses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📍 Nearby Businesses ({pagination.total} found)
            </h3>
            {currentLocation && (
              <p className="text-sm text-gray-600">
                Searching from: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            {businesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevious}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-700">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && businesses.length === 0 && searchParams.lat && searchParams.lng && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">🔍</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No businesses found
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Try expanding your search radius or adjusting your filters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbySearch;
