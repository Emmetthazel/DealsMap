import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Filter, Star, Clock, Percent, Map } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MapContainer from '../components/MapContainer';
import FilterPanel from '../components/FilterPanel';
import ReviewsList from '../components/ReviewsList';
import useReviewsStore from '../store/reviewsStore';
import { useCategoryStore } from '../store/categoryStore';
import useDealsStore from '../store/dealsStore';
import useBusinessStore from '../store/businessStore';

const MapPage = () => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showReviews, setShowReviews] = useState(false);
  const [filters, setFilters] = useState({
    distance: 10,
    city: '',
    neighborhood: '',
    selectedCategories: [],
    minDiscount: 0,
    maxDiscount: 100,
    hasDeals: false,
    expiresInDays: 30,
    showExpiringSoon: false,
    minRating: 0,
    maxRating: 5,
    openNow: false
  });

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

  // Fetch initial data
  useEffect(() => {
    fetchAllCategories();
    fetchDeals();
    fetchBusinesses();
  }, [fetchAllCategories, fetchDeals, fetchBusinesses]);

  // Handle marker click
  const handleMarkerClick = useCallback((data, type) => {
    setSelectedMarker({ data, type });
    setShowReviews(true);
    
    // Fetch reviews for the selected business/deal
    if (type === 'business') {
      fetchBusinessReviews(data.id);
    } else if (type === 'deal') {
      fetchDealReviews(data.id);
    }
  }, [fetchBusinessReviews, fetchDealReviews]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Apply filters to businesses and deals
    // This would typically call filtered API endpoints
    console.log('Applying filters:', newFilters);
    
    // TODO: Implement filtered API calls
    // fetchBusinesses(newFilters);
    // fetchDeals(newFilters);
  }, []);

  // Handle save filters
  const handleSaveFilters = useCallback((filterName, filtersToSave) => {
    saveFilters(filterName, filtersToSave);
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
          center={[2.3522, 48.8566]} // Paris default
          zoom={12}
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
    </div>
  );
};

export default MapPage;
