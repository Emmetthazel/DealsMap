import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Filter, Star, Clock, Percent, Map } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MapContainer from '../components/MapContainer';
import FilterPanel from '../components/FilterPanel';
import ReviewsList from '../components/ReviewsList';
import DealsListPanel from '../components/DealsListPanel';
import useReviewsStore from '../store/reviewsStore';
import { useCategoryStore } from '../store/categoryStore';
import useDealsStore from '../store/dealsStore';
import useBusinessStore from '../store/businessStore';

const MapPage = () => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showReviews, setShowReviews] = useState(false);
  const [mapCenter, setMapCenter] = useState([-6.8498, 34.0209]); // Rabat, Morocco default
  const [mapZoom, setMapZoom] = useState(12); // Default zoom level
  const [selectedLocation, setSelectedLocation] = useState(null); // Track selected location
  const [highlightedDeal, setHighlightedDeal] = useState(null); // Track highlighted deal
  const [filters, setFilters] = useState({
    distance: 10,
    city: '',
    neighborhood: '',
    cityCoordinates: null,
    selectedCategories: [],
    minDiscount: 0,
    maxDiscount: 100,
    hasDeals: false, // Show all businesses by default
    expiresInDays: 90, // Show deals expiring within 90 days by default (more inclusive)
    minRating: 0,
    maxRating: 5,
    openNow: false
  });
  
  // Add sorting state
  const [sortBy, setSortBy] = useState('created_at'); // created_at, rating, discount, expiry
  
  // Handle sorting change
  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    console.log('🔄 Sorting changed to:', newSortBy);
  }, []);

  // Store hooks
  const { 
    categories, 
    fetchAllCategories 
  } = useCategoryStore();
  
  const { 
    deals, 
    fetchDeals, 
    isLoading: dealsLoading 
  } = useDealsStore();
  
  const { 
    businesses, 
    fetchBusinesses, 
    isLoading: businessesLoading 
  } = useBusinessStore();

  // Debug: Log store functions
  console.log('🔍 Store functions check:', {
    fetchAllCategories: typeof fetchAllCategories,
    fetchDeals: typeof fetchDeals,
    fetchBusinesses: typeof fetchBusinesses,
    categoriesLength: categories.length
  });

  // Get only categories that have deals
  const categoriesWithDeals = useMemo(() => {
    if (!categories.length || !deals.length) return [];
    
    console.log('🔍 Building categoriesWithDeals:', {
      categoriesCount: categories.length,
      dealsCount: deals.length,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      dealCategories: deals.map(deal => ({
        dealId: deal.id,
        businessCategoryId: deal.business?.category?.id,
        businessCategoryId2: deal.business?.category_id,
        dealCategoryId: deal.category_id,
        categoryName: deal.category_name
      }))
    });
    
    // Get unique category IDs from deals
    const categoryIdsWithDeals = [...new Set(
      deals
        .map(deal => deal.business?.category?.id || deal.business?.category_id || deal.category_id)
        .filter(Boolean)
    )];
    
    console.log('🔍 Category IDs from deals:', categoryIdsWithDeals);
    
    // Filter categories to only include those with deals
    const filtered = categories.filter(category => categoryIdsWithDeals.includes(category.id));
    
    console.log('🔍 Final categoriesWithDeals:', filtered.map(c => ({ id: c.id, name: c.name })));
    
    return filtered;
  }, [categories, deals]);
  
  const {
    businessReviews,
    dealReviews,
    fetchBusinessReviews,
    fetchDealReviews,
    createReview,
    updateReview,
    deleteReview,
    saveFilters,
    savedFilters
  } = useReviewsStore();

  // Fetch deals with sorting
  const fetchDealsWithSorting = useCallback(async () => {
    try {
      // Use search endpoint when sorting is needed
      if (sortBy !== 'created_at') {
        const searchParams = {
          sort: sortBy,
          category: filters.selectedCategories.length > 0 ? filters.selectedCategories[0] : ''
        };
        
        const response = await fetch(`/api/deals/search/?${new URLSearchParams(searchParams)}`);
        if (response.ok) {
          const data = await response.json();
          // Update the deals store with sorted data
          // Note: This is a workaround since we can't directly update the store
          // In a real app, you'd want to add a setDeals method to the store
          console.log('✅ Deals fetched with sorting:', sortBy, data.results?.length || 0);
        }
      } else {
        // Use regular endpoint for default sorting
        fetchDeals();
      }
    } catch (error) {
      console.error('❌ Error fetching deals with sorting:', error);
      // Fallback to regular fetch
      fetchDeals();
    }
  }, [sortBy, filters.selectedCategories, fetchDeals]);

  // Fetch initial data
  useEffect(() => {
    console.log('🔄 useEffect: Starting to fetch data...');
    console.log('📞 fetchAllCategories function:', fetchAllCategories);
    console.log('📞 fetchDeals function:', fetchDeals);
    console.log('📞 fetchBusinesses function:', fetchBusinesses);
    
    fetchAllCategories();
    fetchDealsWithSorting();
    fetchBusinesses();
  }, [fetchAllCategories, fetchDealsWithSorting, fetchBusinesses]);

  // Debug: Log when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      console.log('All categories loaded:', categories);
    }
  }, [categories]);

  // Debug: Log categories with deals
  useEffect(() => {
    if (categoriesWithDeals.length > 0) {
      console.log('Categories with deals:', categoriesWithDeals);
    }
  }, [categoriesWithDeals]);

  // Debug: Log when deals and businesses are loaded
  useEffect(() => {
    if (deals.length > 0) {
      console.log('Deals loaded:', deals.length, 'deals');
      console.log('Sample deal:', deals[0]);
    }
    if (businesses.length > 0) {
      console.log('Businesses loaded:', businesses.length, 'businesses');
      console.log('Sample business:', businesses[0]);
    }
  }, [deals, businesses]);

  // Handle marker click
  const handleMarkerClick = useCallback((data, type) => {
    console.log('🎯 Marker clicked!', { data, type });
    console.log('🎯 Current state:', { selectedMarker, showReviews });
    
    setSelectedMarker({ data, type });
    setShowReviews(true);
    
    console.log('🎯 After setting state:', { selectedMarker: { data, type }, showReviews: true });
    
    // Fetch reviews for the selected business/deal
    if (type === 'business') {
      console.log('🏢 Fetching business reviews for:', data.id);
      fetchBusinessReviews(data.id);
    } else if (type === 'deal') {
      console.log('🎯 Fetching deal reviews for:', data.id);
      fetchDealReviews(data.id);
    }
  }, [fetchBusinessReviews, fetchDealReviews]);

  // Center map on selected city or neighborhood with appropriate zoom
  const centerMapOnLocation = useCallback((coordinates, locationType) => {
    if (coordinates && coordinates.length === 2) {
      setMapCenter(coordinates);
      
      // Set different zoom levels based on location type
      let zoomLevel = 12; // Default zoom
      
      if (locationType === 'city') {
        zoomLevel = 13; // City level zoom - shows city boundaries
      } else if (locationType === 'neighborhood') {
        zoomLevel = 16; // Neighborhood level zoom - shows streets and buildings
      }
      
      // Update the map center and zoom
      setMapCenter(coordinates);
      setMapZoom(zoomLevel);
      
      // Set the selected location for visual highlighting
      setSelectedLocation({
        coordinates,
        type: locationType,
        name: locationType === 'city' ? filters.city : filters.neighborhood
      });
      
      toast.success(`Map centered on selected ${locationType} (zoom: ${zoomLevel})`);
    }
  }, [filters.city, filters.neighborhood]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    console.log('🔍 Filters changed:', newFilters);
    setFilters(newFilters);
    
    // Center map on selected city if coordinates are provided
    if (newFilters.cityCoordinates) {
      centerMapOnLocation(newFilters.cityCoordinates, 'city');
    }
    
    // Center map on selected neighborhood if coordinates are provided
    if (newFilters.neighborhoodCoordinates) {
      centerMapOnLocation(newFilters.neighborhoodCoordinates, 'neighborhood');
    }
    
    // Clear selected location if no coordinates are provided
    if (!newFilters.cityCoordinates && !newFilters.neighborhoodCoordinates) {
      setSelectedLocation(null);
    }
    
    // Clear highlighted deal when filters change
    setHighlightedDeal(null);
    
    // Apply filters to businesses and deals
    console.log('Applying filters:', newFilters);
    
    // Apply category filtering
    if (newFilters.selectedCategories && newFilters.selectedCategories.length > 0) {
      console.log('Filtering by categories:', newFilters.selectedCategories);
      // TODO: Implement API filtering by categories
      // For now, we'll filter the existing data
    }
    
    // Apply other filters
    if (newFilters.hasDeals) {
      console.log('Filtering: Only businesses with deals');
    }
    
    if (newFilters.minDiscount > 0 || newFilters.maxDiscount < 100) {
      console.log('Filtering by discount range:', newFilters.minDiscount, '-', newFilters.maxDiscount);
    }
    
    // TODO: Implement filtered API calls
    // fetchBusinesses(newFilters);
    // fetchDeals(newFilters);
  }, [centerMapOnLocation]);

  // Handle save filters
  const handleSaveFilters = useCallback((filterToSave) => {
    console.log('💾 Saving filters:', filterToSave);
    try {
      saveFilters(filterToSave.name, filterToSave.filters);
      console.log('✅ Filters saved successfully');
    } catch (error) {
      console.error('❌ Error saving filters:', error);
    }
  }, [saveFilters]);

  // Handle review submission
  const handleReviewSubmit = useCallback(async (reviewData) => {
    try {
      if (selectedMarker?.type === 'business') {
        await createReview({
          ...reviewData,
          business: selectedMarker.data.id
        });
      } else if (selectedMarker?.type === 'deal') {
        await createReview({
          ...reviewData,
          deal: selectedMarker.data.id
        });
      }
      
      // Refresh reviews
      if (selectedMarker?.type === 'business') {
        await fetchBusinessReviews(selectedMarker.data.id);
      } else if (selectedMarker?.type === 'deal') {
        await fetchDealReviews(selectedMarker.data.id);
      }
      
      toast.success('Review submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
      throw error;
    }
  }, [selectedMarker, createReview, fetchBusinessReviews, fetchDealReviews]);

  // Handle review update
  const handleReviewUpdate = useCallback(async (reviewId, reviewData) => {
    try {
      await updateReview(reviewId, reviewData);
      
      // Refresh reviews
      if (selectedMarker?.type === 'business') {
        await fetchBusinessReviews(selectedMarker.data.id);
      } else if (selectedMarker?.type === 'deal') {
        await fetchDealReviews(selectedMarker.data.id);
      }
      
      toast.success('Review updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update review');
      throw error;
    }
  }, [selectedMarker, updateReview, fetchBusinessReviews, fetchDealReviews]);

  // Handle review deletion
  const handleReviewDelete = useCallback(async (reviewId) => {
    try {
      await deleteReview(reviewId);
      
      // Refresh reviews
      if (selectedMarker?.type === 'business') {
        await fetchBusinessReviews(selectedMarker.data.id);
      } else if (selectedMarker?.type === 'deal') {
        await fetchDealReviews(selectedMarker.data.id);
      }
      
      toast.success('Review deleted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to delete review');
      throw error;
    }
  }, [selectedMarker, deleteReview, fetchBusinessReviews, fetchDealReviews]);

  // Get current reviews based on selected marker
  const getCurrentReviews = () => {
    if (!selectedMarker) return [];
    
    if (selectedMarker.type === 'business') {
      return businessReviews[selectedMarker.data.id] || [];
    } else if (selectedMarker.type === 'deal') {
      return dealReviews[selectedMarker.data.id] || [];
    }
    
    return [];
  };

  // Get current user ID (you might want to get this from auth store)
  const getCurrentUserId = () => {
    // TODO: Implement proper user ID retrieval
    return 1; // Placeholder
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Filters and Info */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600" />
            DealsMap
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Discover the best deals near you
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <FilterPanel
            categories={categories}
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            onSaveFilters={handleSaveFilters}
            onLoadFilters={() => {}} // Placeholder for now
            savedFilters={savedFilters}
          />
        </div>

        {/* Selected Marker Info */}
        {selectedMarker && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-medium text-blue-900 mb-2">
                {selectedMarker.type === 'business' ? 'Business' : 'Deal'} Details
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">
                    {selectedMarker.data.name || selectedMarker.data.title}
                  </span>
                </div>
                
                {selectedMarker.type === 'deal' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">
                        {selectedMarker.data.discount_percentage}% off
                      </span>
                    </div>
                    
                    {selectedMarker.data.expires_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-800">
                          Expires {new Date(selectedMarker.data.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {selectedMarker.data.category && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800">
                      {selectedMarker.data.category.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {selectedMarker && showReviews && (
          <div className="flex-1 overflow-y-auto">
            <ReviewsList
              reviews={getCurrentReviews()}
              businessId={selectedMarker.type === 'business' ? selectedMarker.data.id : null}
              dealId={selectedMarker.type === 'deal' ? selectedMarker.data.id : null}
              onAddReview={handleReviewSubmit}
              onEditReview={handleReviewUpdate}
              onDeleteReview={handleReviewDelete}
              currentUserId={getCurrentUserId()}
              showAddButton={true}
              className="p-4"
            />
          </div>
        )}

        {/* Loading State */}
        {(dealsLoading || businessesLoading) && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading data...</p>
          </div>
        )}
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          businesses={businesses}
          deals={deals}
          onMarkerClick={handleMarkerClick}
          center={mapCenter}
          zoom={mapZoom}
          onZoomChange={setMapZoom}
          selectedLocation={selectedLocation}
          highlightedDeal={highlightedDeal}
          key={`${mapCenter.join(',')}-${mapZoom}`} // Force re-render when center or zoom changes
        />
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className={`p-3 rounded-lg shadow-lg transition-colors ${
              showReviews 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={showReviews ? 'Hide Reviews' : 'Show Reviews'}
          >
            <Star className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Deals List Panel */}
      <DealsListPanel
        deals={deals}
        businesses={businesses}
        filters={filters}
        categories={categories}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onDealClick={(deal) => {
          // Center map on the deal's business location and highlight it
          const latitude = deal.business?.latitude || deal.business_location?.latitude || deal.latitude;
          const longitude = deal.business?.longitude || deal.business_location?.longitude || deal.longitude;
          const businessName = deal.business?.name || deal.business_name;
          
          if (latitude && longitude) {
            setMapCenter([longitude, latitude]);
            setMapZoom(16); // Zoom to street level
            setHighlightedDeal(deal); // Highlight the deal on the map
            toast.success(`Centered on ${businessName}`);
          }
        }}
        onShowOnMap={(deal) => {
          // Center map on the deal's business location and highlight it
          const latitude = deal.business?.latitude || deal.business_location?.latitude || deal.latitude;
          const longitude = deal.business?.longitude || deal.business_location?.longitude || deal.longitude;
          const businessName = deal.business?.name || deal.business_name;
          
          if (latitude && longitude) {
            setMapCenter([longitude, latitude]);
            setMapZoom(16); // Zoom to street level
            setHighlightedDeal(deal); // Highlight the deal on the map
            toast.success(`Showing ${businessName} on map`);
          }
        }}
      />
    </div>
  );
};

export default MapPage;
