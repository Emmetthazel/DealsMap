import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DealService from '../services/DealService';
import AuthService from '../services/AuthService';
import { toast } from 'react-hot-toast';
import useReviewsStore from '../store/reviewsStore';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import { Star, MessageCircle } from 'lucide-react';

const DealsList = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sort: ''
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });
  
  // Rating system state
  const [selectedDealForRating, setSelectedDealForRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();

  // Review store
  const {
    dealReviews,
    fetchDealReviews,
    createReview,
    updateReview,
    deleteReview
  } = useReviewsStore();

  // Load deals on component mount
  useEffect(() => {
    loadDeals();
    loadCategories();
  }, []);

  // Check authentication status - BULLETPROOF VERSION
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = AuthService.isAuthenticated();
      console.log('🔐 BULLETPROOF Auth check - Token exists:', isAuth, 'Setting authenticated:', isAuth);
      setIsAuthenticated(isAuth);
      
      // If we have a token, we're definitely authenticated
      if (isAuth) {
        console.log('🔐 User is authenticated, ensuring state is correct');
      } else {
        console.log('🔐 No token found, user is not authenticated');
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Check every 2 seconds to catch any changes
    const interval = setInterval(checkAuth, 2000);
    
    // Also check on any user interaction
    const handleUserInteraction = () => {
      checkAuth();
    };
    
    // Listen for various user interactions
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('scroll', handleUserInteraction);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
    };
  }, []);

  // Load deals with search and filters
  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading deals with filters:', filters);
      console.log('🔍 Category filter value:', filters.category);
      console.log('🔍 Category filter type:', typeof filters.category);
      console.log('🔍 Sort filter value:', filters.sort);
      console.log('🔍 Sort filter type:', typeof filters.sort);
      
      // Check if any filters are applied
      const hasFilters = filters.search || filters.category || filters.sort;
      
      let response;
      
      if (hasFilters) {
        // Use search endpoint when filters are applied
        console.log('🔍 Filters detected, using search endpoint...');
        try {
          const searchParams = {
            search: filters.search,
            category: filters.category,
            sort: filters.sort,
            page: pagination.current_page
          };
          
          console.log('🔍 Search params being sent:', searchParams);
          console.log('🔍 Category ID being sent:', searchParams.category);
          console.log('🔍 Sort option being sent:', searchParams.sort);
          
          response = await DealService.searchDealsPublic(searchParams);
          console.log('✅ Search endpoint worked:', response);
        } catch (searchError) {
          console.log('❌ Search endpoint failed:', searchError);
          throw searchError;
        }
      } else {
        // Use simple list endpoint only when no filters are applied
        console.log('🔄 No filters, trying simple list endpoint...');
        try {
          const listResponse = await fetch('/api/deals/');
          if (listResponse.ok) {
            response = await listResponse.json();
            console.log('✅ Simple list endpoint worked:', response);
          } else {
            throw new Error(`List endpoint failed: ${listResponse.status}`);
          }
        } catch (listError) {
          console.log('❌ List endpoint failed, trying search endpoint as fallback:', listError);
          
          // Fallback to search endpoint
          try {
            const searchParams = {
              search: '',
              category: '',
              sort: '',
              page: pagination.current_page
            };
            
            response = await DealService.searchDealsPublic(searchParams);
            console.log('✅ Search endpoint fallback worked:', response);
          } catch (searchError) {
            console.log('❌ Search endpoint fallback also failed:', searchError);
            throw searchError;
          }
        }
      }
      
      console.log('📊 Final deals response:', response);
      
      // Handle different response formats
      const dealsArray = response.deals || response.results || response;
      const dealsData = Array.isArray(dealsArray) ? dealsArray : [];
      
      console.log('🎯 Final deals data:', dealsData);
      console.log('🎯 Number of deals found:', dealsData.length);
      
      // Debug: Show first few deals and their sorting fields
      if (dealsData.length > 0) {
        console.log('🔍 First 3 deals for sorting verification:');
        dealsData.slice(0, 3).forEach((deal, index) => {
          console.log(`  Deal ${index + 1}:`, {
            title: deal.title,
            end_date: deal.end_date,
            deal_price: deal.deal_price,
            discount_percentage: deal.discount_percentage,
            created_at: deal.created_at
          });
        });
      }
      
      setDeals(dealsData);
      
      // Update pagination if available
      if (response.count !== undefined) {
        setPagination(prev => ({
          ...prev,
          count: response.count,
          next: response.next,
          previous: response.previous,
          current_page: response.current_page || 1
        }));
      }
    } catch (error) {
      console.error('❌ Error loading deals:', error);
      toast.error('Erreur lors du chargement des deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current_page]);

  // Load categories for filter dropdown
  const loadCategories = async () => {
    try {
      console.log('🏷️ Loading categories...');
      const response = await fetch('/api/deals/categories/');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Categories loaded:', data);
        console.log('🏷️ Categories structure:', data.map(cat => ({ id: cat.id, name: cat.name })));
        setCategories(data);
      } else {
        console.log('❌ Categories endpoint failed, trying alternative...');
        // Try alternative categories endpoint
        const altResponse = await fetch('/api/categories/');
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('✅ Alternative categories loaded:', altData);
          console.log('🏷️ Alternative categories structure:', altData.map(cat => ({ id: cat.id, name: cat.name })));
          setCategories(altData);
        } else {
          console.error('❌ All categories endpoints failed');
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setCategories([]);
    }
  };

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback((name, value) => {
    console.log(`🔧 Filter change - ${name}:`, value);
    console.log(`🔧 Filter change - ${name} type:`, typeof value);
    console.log(`🔧 Previous filters:`, filters);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      console.log(`🔧 New filters:`, newFilters);
      return newFilters;
    });
    
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page
  }, [filters]);

  // Effect to reload deals when filters change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDeals();
    }, 300); // 300ms delay for filter changes
    
    return () => clearTimeout(timeoutId);
  }, [filters.category, filters.sort, loadDeals]);

  // Separate effect for search with longer debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDeals();
    }, 500); // 500ms delay for search to reduce API calls
    
    return () => clearTimeout(timeoutId);
  }, [filters.search, loadDeals]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadDeals();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      category: '',
      search: '',
      sort: ''
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
    setTimeout(() => loadDeals(), 100);
  };

  // Handle deal click
  const handleDealClick = (deal) => {
    // Navigate to deal details or show modal
    console.log('Deal clicked:', deal);
    // You can implement deal details view here
  };

  // Format price
  const formatPrice = (price) => {
    return `${price} DH`;
  };

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, discountedPrice) => {
    try {
      if (!originalPrice || !discountedPrice) return 0;
      return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
    } catch (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }
  };

  // Get days until expiry
  const getDaysUntilExpiry = (endDate) => {
    try {
      if (!endDate) return 'Date inconnue';
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Expiré';
      if (diffDays === 0) return 'Expire aujourd\'hui';
      if (diffDays === 1) return 'Expire demain';
      return `Expire dans ${diffDays} jours`;
    } catch (error) {
      console.error('Error calculating expiry:', error);
      return 'Date inconnue';
    }
  };

  // Get deal status color
  const getStatusColor = (deal) => {
    try {
      if (!deal || !deal.is_active) return 'bg-red-100 text-red-800';
      if (deal.current_uses >= deal.max_uses) return 'bg-orange-100 text-orange-800';
      return 'bg-green-100 text-green-800';
    } catch (error) {
      console.error('Error getting status color:', error);
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Get deal status text
  const getStatusText = (deal) => {
    try {
      if (!deal || !deal.is_active) return 'Inactif';
      if (deal.current_uses >= deal.max_uses) return 'Complet';
      return 'Actif';
    } catch (error) {
      console.error('Error getting status text:', error);
      return 'Inconnu';
    }
  };

  // Get category icon
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return 'fas fa-tag'; // Default icon for undefined/null
    
    switch (categoryName.toLowerCase()) {
      case 'restaurant':
        return 'fas fa-utensils';
      case 'shopping':
        return 'fas fa-shopping-cart';
      case 'entertainment':
        return 'fas fa-film';
      case 'health':
        return 'fas fa-heartbeat';
      case 'beauty':
        return 'fas fa-spa';
      case 'education':
        return 'fas fa-graduation-cap';
      case 'travel':
        return 'fas fa-plane';
      default:
        return 'fas fa-tag'; // Default icon
    }
  };

  // Get category gradient background
  const getCategoryGradient = (categoryName) => {
    if (!categoryName) return 'from-gray-400 to-gray-500'; // Default gradient for undefined/null
    
    switch (categoryName.toLowerCase()) {
      case 'restaurant':
        return 'from-blue-400 to-purple-500';
      case 'shopping':
        return 'from-green-400 to-teal-500';
      case 'entertainment':
        return 'from-red-400 to-pink-500';
      case 'health':
        return 'from-yellow-400 to-orange-500';
      case 'beauty':
        return 'from-indigo-400 to-purple-500';
      case 'education':
        return 'from-blue-400 to-cyan-500';
      case 'travel':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-gray-400 to-gray-500'; // Default gradient
    }
  };

  // Rating system functions - BULLETPROOF VERSION
  const handleRateDeal = (deal) => {
    console.log('🔐 Rating button clicked for deal:', deal.id);
    
    // Check if user is authenticated using AuthService (handles both localStorage and sessionStorage)
    const isAuth = AuthService.isAuthenticated();
    
    console.log('🔐 AuthService check:', isAuth);
    console.log('🔐 State check:', isAuthenticated);
    
    if (!isAuth) {
      console.log('❌ No token found, redirecting to login');
      toast.error('Please log in to rate deals');
      navigate('/login');
      return;
    }
    
    // If we have a token, force authentication state to true
    if (!isAuthenticated) {
      console.log('🔐 Token exists but state is false, fixing state...');
      setIsAuthenticated(true);
    }
    
    console.log('✅ User is authenticated, opening rating modal');
    setSelectedDealForRating(deal);
    setShowRatingModal(true);
    
    // Load existing reviews for this deal
    console.log('🔄 Loading reviews for deal:', deal.id);
    fetchDealReviews(deal.id);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const reviewPayload = {
        ...reviewData,
        deal: selectedDealForRating.id
      };
      
      console.log('📝 Review payload being sent:', reviewPayload);
      console.log('📝 Selected deal:', selectedDealForRating);
      console.log('📝 Review data:', reviewData);
      console.log('📝 Rating value type:', typeof reviewData.rating);
      console.log('📝 Rating value:', reviewData.rating);
      
      await createReview(reviewPayload);
      toast.success('Review submitted successfully!');
      
      // Force refresh the reviews data
      console.log('🔄 Refreshing reviews for deal:', selectedDealForRating.id);
      
      // Fetch fresh reviews with force refresh
      await fetchDealReviews(selectedDealForRating.id);
      
      // Also refresh the deals list to update the rating display
      await loadDeals();
      
      setShowRatingModal(false);
    } catch (error) {
      console.error('❌ Review submission error:', error);
      toast.error(error.message || 'Failed to submit review');
      throw error;
    }
  };

  const handleReviewUpdate = async (reviewId, reviewData) => {
    try {
      await updateReview(reviewId, reviewData);
      toast.success('Review updated successfully!');
      await fetchDealReviews(selectedDealForRating.id);
    } catch (error) {
      toast.error(error.message || 'Failed to update review');
      throw error;
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted successfully!');
      await fetchDealReviews(selectedDealForRating.id);
    } catch (error) {
      toast.error(error.message || 'Failed to delete review');
      throw error;
    }
  };

  const getCurrentReviews = () => {
    if (selectedDealForRating) {
      return dealReviews[selectedDealForRating.id] || [];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              <i className="fas fa-tags mr-3"></i>
              Liste des Deals
            </h1>
            <p className="mt-2 text-gray-600">Tous les deals disponibles près de vous</p>
            

          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un deal..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                </div>
              </form>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes catégories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Trier par</option>
                <option value="expiry">Date d'expiration</option>
                <option value="discount">Pourcentage de réduction</option>
                <option value="rating">Note des clients</option>
                <option value="price">Prix</option>
              </select>

              {/* Search Button */}
              <button
                onClick={loadDeals}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Rechercher
              </button>

              {/* Clear Filters */}
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Effacer les filtres
              </button>
            </div>

            {/* Active Filters Display */}
            {(filters.search || filters.category || filters.sort) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <i className="fas fa-filter"></i>
                  <span className="font-medium">Filtres actifs:</span>
                  {filters.search && (
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Recherche: "{filters.search}"
                    </span>
                  )}
                  {filters.category && (
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Catégorie: {categories.find(cat => cat.id === filters.category)?.name || filters.category}
                    </span>
                  )}
                  {filters.sort && (
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      Tri: {filters.sort === 'expiry' ? 'Date d\'expiration' : 
                             filters.sort === 'discount' ? 'Pourcentage de réduction' :
                             filters.sort === 'rating' ? 'Note des clients' :
                             filters.sort === 'price' ? 'Prix' : filters.sort}
                    </span>
                  )}
                </div>
                
                {/* Additional Info for Sorting */}
                {filters.sort && (
                  <div className="mt-2 text-xs text-blue-700">
                    <i className="fas fa-info-circle mr-1"></i>
                    {filters.sort === 'expiry' && 'Deals expirant bientôt en premier'}
                    {filters.sort === 'discount' && 'Deals avec les plus grandes réductions en premier'}
                    {filters.sort === 'rating' && 'Deals avec les meilleures notes en premier'}
                    {filters.sort === 'price' && 'Deals les moins chers en premier'}
                  </div>
                )}
                
                {/* Sorting Order Indicator */}
                {filters.sort && deals.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    <i className="fas fa-sort-amount-down mr-1"></i>
                    <strong>Ordre actuel:</strong> 
                    {filters.sort === 'expiry' && 'Par date d\'expiration (plus tôt → plus tard)'}
                    {filters.sort === 'discount' && 'Par réduction (plus grande → plus petite)'}
                    {filters.sort === 'rating' && 'Par note (plus haute → plus basse)'}
                    {filters.sort === 'price' && 'Par prix (moins cher → plus cher)'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des deals...</span>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-search text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun deal trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                {pagination.count > 0 ? `${pagination.count} deals trouvés` : `${deals.length} deals affichés`}
              </p>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {deals
                .filter(deal => deal && deal.id) // Filter out invalid deals
                .map((deal) => {
                  try {
                    return (
                      <div
                        key={deal.id}
                        onClick={() => handleDealClick(deal)}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
                      >
                        {/* Deal Image */}
                        <div className="relative h-48 overflow-hidden">
                          {deal.image ? (
                            // Show actual deal image if available
                            <img 
                              src={deal.image} 
                              alt={deal.title || 'Deal'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            // Fallback to gradient background with icon
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(deal.business__category || deal.category_name || deal.category?.name)}`}>
                              <div className="text-center">
                                <i className={`${getCategoryIcon(deal.business__category || deal.category_name || deal.category?.name)} text-white text-5xl mb-2`}></i>
                                <p className="text-white text-sm font-medium opacity-90">
                                  {deal.business__category || deal.category_name || deal.category?.name || 'Deal'}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Discount badge */}
                          {deal.original_price && deal.discounted_price && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              -{calculateDiscount(deal.original_price, deal.discounted_price)}%
                            </div>
                          )}
                          
                          {/* Status badge */}
                          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium shadow-lg ${getStatusColor(deal)}`}>
                            {getStatusText(deal)}
                          </div>
                          
                          {/* Business category icon overlay (only show if there's an image) */}
                          {deal.image && (deal.business__category || deal.category_name || deal.category?.name) && (
                            <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                              <i className={`text-lg text-gray-700 ${getCategoryIcon(deal.business__category || deal.category_name || deal.category?.name)}`}></i>
                            </div>
                          )}
                        </div>

                        {/* Deal Content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {deal.title || 'Sans titre'}
                          </h3>
                          
                          {/* Discount Display - Prominent */}
                          {deal.discount_percentage && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                <i className="fas fa-percent text-sm"></i>
                                <span className="text-sm font-bold">
                                  {deal.discount_percentage}% OFF
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600 mb-3">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {deal.business_name || 'Établissement inconnu'}
                            {deal.business_address && (
                              <span className="block text-xs text-gray-500 mt-1">
                                {deal.business_address}
                              </span>
                            )}
                          </div>

                          {/* Price Display - Compact */}
                          <div className="flex items-center gap-2 mb-2">
                            {deal.deal_price && (
                              <span className="text-base font-semibold text-green-600">
                                {formatPrice(deal.deal_price)}
                              </span>
                            )}
                            {deal.original_price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(deal.original_price)}
                              </span>
                            )}
                          </div>

                          {/* Deal Footer */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                              <i className="fas fa-star text-yellow-400 mr-1"></i>
                              <span>
                                {deal.average_rating ? `${deal.average_rating.toFixed(1)}` : '0.0'} 
                                ({deal.review_count || 0})
                              </span>
                            </div>
                            <div className="text-xs">
                              {getDaysUntilExpiry(deal.end_date)}
                            </div>
                          </div>

                          {/* Rating Button */}
                          <div className="mt-4 flex justify-center">
                            <button
                              onClick={() => handleRateDeal(deal)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 ${
                                isAuthenticated 
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                              }`}
                            >
                              <Star className="w-4 h-4" />
                              {isAuthenticated ? 'Rate this Deal' : 'Login to Rate'}
                            </button>
                          </div>

                          {/* Usage Info */}
                          {deal.max_uses && (
                            <div className="mt-3 text-xs text-gray-500">
                              <i className="fas fa-users mr-1"></i>
                              {deal.current_uses || 0}/{deal.max_uses} utilisations
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering deal:', deal, error);
                    return (
                      <div key={deal.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">Erreur d'affichage du deal</p>
                      </div>
                    );
                  }
                })}
            </div>

            {/* Pagination */}
            {pagination.count > 0 && (pagination.next || pagination.previous) && (
              <div className="mt-8 bg-white rounded-lg shadow px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.current_page} sur {Math.ceil(pagination.count / 10)}
                  </div>
                  <div className="flex space-x-2">
                    {pagination.previous && (
                      <button
                        onClick={() => {
                          setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Précédent
                      </button>
                    )}
                    {pagination.next && (
                      <button
                        onClick={() => {
                          setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Suivant
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && selectedDealForRating && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Rate: {selectedDealForRating.title}
                      </h2>
                      <button
                        onClick={() => setShowRatingModal(false)}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Review Form */}
                    <ReviewForm
                      businessId={selectedDealForRating.business?.id}
                      dealId={selectedDealForRating.id}
                      onSubmit={handleReviewSubmit}
                      onCancel={() => setShowRatingModal(false)}
                    />
                    
                    {/* Existing Reviews */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                      <ReviewsList
                        reviews={getCurrentReviews()}
                        businessId={selectedDealForRating.business?.id}
                        dealId={selectedDealForRating.id}
                        onAddReview={handleReviewSubmit}
                        onEditReview={handleReviewUpdate}
                        onDeleteReview={handleReviewDelete}
                        currentUserId={1}
                        showAddButton={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DealsList;
