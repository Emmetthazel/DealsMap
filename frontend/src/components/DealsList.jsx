import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DealService from '../services/DealService';
import { fetchCategories } from '../services/categoryService';
import { toast } from 'react-hot-toast';
import useDealsStore from '../store/dealsStore';

const DealsList = ({ showMyDeals = false, showNearby = false, initialFilters = {}, onCreateDeal, onCreateBusiness, onViewDeal, onEditDeal, onDeleteDeal, onReactivateDeal, refreshKey = 0, forceRefresh = 0 }) => {
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
    radius: 10,
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
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ latitude: '', longitude: '' });
  const [locationRequested, setLocationRequested] = useState(false);

  // Define all callback functions first
  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      const categoriesData = await fetchCategories();
      console.log('Categories loaded:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Silent error handling
    }
  };

  // Get user's current location
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      setShowManualLocation(true);
      return;
    }

    setLocationRequested(true);
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 600000 // Increased to 10 minutes for better caching
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      setLocationRequested(false);
      toast.success('Localisation obtenue avec succès !');
    } catch (error) {
      console.error('Geolocation error:', error);
      let errorMessage = 'Impossible d\'obtenir votre localisation.';
      let showManualLocation = true;
      
      if (error.code === 1) {
        errorMessage = 'Accès à la géolocalisation refusé. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.';
        showManualLocation = true;
      } else if (error.code === 2) {
        errorMessage = 'Position indisponible. Cela peut être dû à :\n• Pas de signal GPS (intérieur, sous-sol)\n• Services de localisation désactivés\n• Pas de connexion réseau\n\nUtilisez la localisation manuelle ci-dessous.';
        showManualLocation = true;
      } else if (error.code === 3) {
        errorMessage = 'Délai d\'attente dépassé. Essayez de nouveau ou utilisez la localisation manuelle.';
        showManualLocation = true;
      }
      
      setError(errorMessage);
      if (showManualLocation) {
        setShowManualLocation(true);
        // Set a default location (Casablanca) as fallback
        setUserLocation({
          latitude: 33.5731,
          longitude: -7.5898
        });
        toast.info('Localisation par défaut définie (Casablanca). Vous pouvez la modifier manuellement.');
      }
      setLocationRequested(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeals = useCallback(async () => {
    console.log('DealsList: loadDeals called with:', { showNearby, showMyDeals, filters, userLocation });
    setLoading(true);
    setError(null);

    try {
      let dealsData;
      console.log('loadDeals called with:', { showNearby, showMyDeals, filters, userLocation });

      if (showNearby && userLocation) {
        console.log('Loading nearby deals...');
        dealsData = await DealService.getNearbyDeals(
          userLocation.latitude,
          userLocation.longitude,
          filters.radius || 10,
          filters.category
        );
      } else if (showMyDeals) {
        // For My Deals, use search endpoint if there are search filters, otherwise use my-deals
        const hasSearchFilters = filters.search || filters.category || filters.min_price || filters.max_price || filters.min_discount;
        console.log('My Deals - hasSearchFilters:', hasSearchFilters, 'filters:', filters);
        
                 if (hasSearchFilters) {
          console.log('Using search endpoint for My Deals with owner filter');
          console.log('Category filter value:', filters.category);
          // Use search endpoint with owner filter
          dealsData = await DealService.searchDeals({
            ...filters,
            owner: 'me', // This will be handled by backend to filter by current user
            page: pagination.current_page
          });
        } else {
         console.log('Using my-deals endpoint for simple status filtering');
         // Use my-deals endpoint for simple status filtering
       dealsData = await DealService.getMyDeals(filters.status);
       }
            } else {
        console.log('Loading all deals with search...');
        console.log('Category filter value for All Deals:', filters.category);
        dealsData = await DealService.searchDeals({
          ...filters,
          page: pagination.current_page
        });
      }

      console.log('Deals data received:', dealsData);
      console.log('Deals data type:', typeof dealsData);
      console.log('Deals data keys:', dealsData ? Object.keys(dealsData) : 'null');
      console.log('Deals count:', dealsData?.results?.length || dealsData?.length || 0);

      if (dealsData.results) {
        console.log('Search results with priority:', dealsData.results.map(deal => ({
          id: deal.id,
          title: deal.title,
          search_priority: deal.search_priority || 'N/A'
        })));
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
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showNearby, showMyDeals, userLocation, filters, pagination.current_page]);

  const loadNearbyDeals = useCallback(async () => {
    if (!userLocation) {
      setError('Localisation requise pour charger les deals à proximité.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading nearby deals for location:', userLocation);
      const dealsData = await DealService.getNearbyDeals(
        userLocation.latitude,
        userLocation.longitude,
        filters.radius || 10,
        filters.category || null
      );

      if (dealsData && dealsData.results) {
        setDeals(dealsData.results);
        setPagination({
          count: dealsData.count || dealsData.results.length,
          current_page: dealsData.current_page || 1,
          total_pages: dealsData.total_pages || 1,
          next: dealsData.next,
          previous: dealsData.previous
        });
        
        if (dealsData.results.length === 0) {
          setError('Aucun deal trouvé dans un rayon de ' + (filters.radius || 10) + 'km. Essayez d\'augmenter le rayon ou de changer de catégorie.');
        }
      } else {
        setDeals([]);
        setPagination({
          count: 0,
          current_page: 1,
          total_pages: 1,
          next: null,
          previous: null
        });
        setError('Aucun deal trouvé dans un rayon de ' + (filters.radius || 10) + 'km.');
      }
    } catch (error) {
      console.error('Error loading nearby deals:', error);
      setError('Erreur lors du chargement des deals à proximité. Veuillez réessayer.');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters.radius, filters.category]);

  // useEffect hooks - placed here after all functions are defined
  useEffect(() => {
    loadCategories();
  }, []); // Only run once on mount

  useEffect(() => {
    if (showNearby && !locationRequested) {
      getUserLocation();
    } else if (!showNearby) {
      // Reset location state when not showing nearby deals
      setLocationRequested(false);
      setUserLocation(null);
      setShowManualLocation(false);
    }
  }, [showNearby]); // Remove locationRequested from dependencies to prevent loops

  useEffect(() => {
    if (showNearby && userLocation) {
      loadNearbyDeals();
    } else if (!showNearby) {
      loadDeals();
    }
  }, [showNearby, userLocation, loadNearbyDeals, loadDeals]);

  // Effect to refresh deals when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      if (showNearby && userLocation) {
        loadNearbyDeals();
      } else if (!showNearby) {
        loadDeals();
      }
    }
  }, [refreshKey, showNearby, userLocation, loadNearbyDeals, loadDeals]);

  // Effect to force refresh all tabs when forceRefresh changes
  useEffect(() => {
    console.log('DealsList: forceRefresh changed to:', forceRefresh);
    if (forceRefresh > 0) {
      console.log('DealsList: Triggering force refresh for tab:', { showMyDeals, showNearby });
      if (showNearby && userLocation) {
        console.log('DealsList: Loading nearby deals due to force refresh');
        loadNearbyDeals();
      } else if (!showNearby) {
        console.log('DealsList: Loading deals due to force refresh');
        loadDeals();
      }
    }
  }, [forceRefresh, showNearby, userLocation, loadNearbyDeals, loadDeals]);

  // Effect to reload deals when filters change
  useEffect(() => {
    if (!showNearby) {
      // Add a small delay to prevent excessive API calls during typing
      const timeoutId = setTimeout(() => {
        loadDeals();
      }, 300); // 300ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.status, filters.category, showNearby, loadDeals]);

  // Separate effect for search with debouncing
  useEffect(() => {
    if (!showNearby && filters.search !== undefined) {
      const timeoutId = setTimeout(() => {
        loadDeals();
      }, 500); // 500ms delay for search to reduce API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.search, showNearby, loadDeals]);

  // Effect to reload nearby deals when radius changes
  useEffect(() => {
    if (showNearby && userLocation && filters.radius !== undefined) {
      const timeoutId = setTimeout(() => {
        loadNearbyDeals();
      }, 300); // 300ms delay for radius changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.radius, showNearby, userLocation, loadNearbyDeals]);

  // Effect to periodically check for expired deals (every 5 minutes)
  useEffect(() => {
    if (!showMyDeals) return; // Only for My Deals tab
    
    const interval = setInterval(() => {
      // Check if any deals have expired since last load
      const now = new Date();
      const hasExpiredDeals = deals.some(deal => {
        if (deal.is_active && deal.end_date) {
          const endDate = new Date(deal.end_date);
          return now > endDate;
        }
        return false;
      });
      
      if (hasExpiredDeals) {
        console.log('DealsList: Found expired deals, refreshing...');
        loadDeals();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [deals, showMyDeals, loadDeals]);

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
      fully_used: 0,
      inactive: 0,
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

  if (loading && deals.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          {showNearby ? 'Recherche des deals à proximité...' : 'Chargement des deals...'}
        </span>
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
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {showNearby ? 'Erreur de localisation' : 'Erreur'}
            </h3>
            <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
              {error}
            </div>
            {showNearby && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => {
                    setError(null);
                    getUserLocation();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline mr-4"
                >
                  Réessayer la géolocalisation
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setShowManualLocation(true);
                    // Set default location if none exists
                    if (!userLocation) {
                      setUserLocation({
                        latitude: 33.5731,
                        longitude: -7.5898
                      });
                      toast.info('Localisation par défaut définie (Casablanca). Vous pouvez la modifier manuellement.');
                    }
                  }}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Utiliser la localisation manuelle
                </button>
              </div>
            )}
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
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-semibold text-red-600">{stats.expired}</p>
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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
                         <select
               value={filters.category}
               onChange={(e) => {
                 const categoryValue = e.target.value;
                 console.log('Category changed to:', categoryValue);
                 console.log('Category value type:', typeof categoryValue);
                 console.log('Category value truthy:', !!categoryValue);
                 setFilters(prev => ({ ...prev, category: categoryValue }));
               }}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
              <option value="">Toutes les catégories</option>
              {console.log('Rendering categories:', categories)}
              {categories && categories.length > 0 ? (
                categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
                ))
              ) : (
                <option value="" disabled>Chargement des catégories...</option>
              )}
            </select>
          </div>

          {/* Status Filter for My Deals */}
          {showMyDeals && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="expired">Expirés</option>
                <option value="upcoming">À venir</option>
              </select>
            </div>
          )}
        </div>

        {/* Manual Location Input for Nearby Deals */}
        {showNearby && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Localisation</h4>
              <div className="flex items-center space-x-2">
                {locationRequested && (
                  <div className="flex items-center text-blue-600 text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Demande en cours...
                  </div>
                )}
                {userLocation && (
                  <div className="flex items-center text-green-600 text-xs">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                    </svg>
                    Localisation active
                  </div>
                )}
                <button
                  onClick={() => setShowManualLocation(!showManualLocation)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showManualLocation ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
            
            {/* Radius Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rayon de recherche: {filters.radius || 10} km
                {loading && showNearby && (
                  <span className="ml-2 text-blue-600 text-xs">(Chargement...)</span>
                )}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius || 10}
                onChange={(e) => {
                  const newRadius = parseInt(e.target.value);
                  setFilters(prev => ({ ...prev, radius: newRadius }));
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
            
            {/* Current Location Display */}
            {userLocation && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-800">
                    <strong>Localisation actuelle :</strong> {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </div>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setManualLocation({ latitude: '', longitude: '' });
                      toast.info('Localisation réinitialisée');
                    }}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
            
            {showManualLocation && (
              <>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Conseil :</strong> Si la géolocalisation automatique ne fonctionne pas, 
                    vous pouvez saisir manuellement vos coordonnées GPS ou utiliser une ville connue 
                    (ex: Casablanca: 33.5731, -7.5898).
                  </p>
                </div>
                
                {/* Preset City Locations */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Villes prédéfinies
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
                      { name: 'Rabat', lat: 34.0209, lng: -6.8416 },
                      { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
                      { name: 'Fès', lat: 34.0181, lng: -5.0078 },
                      { name: 'Agadir', lat: 30.4278, lng: -9.5981 },
                      { name: 'Tanger', lat: 35.7595, lng: -5.8340 },
                      { name: 'Meknès', lat: 33.8935, lng: -5.5473 },
                      { name: 'Oujda', lat: 34.6814, lng: -1.9086 }
                    ].map(city => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setUserLocation({ latitude: city.lat, longitude: city.lng });
                          setManualLocation({ latitude: city.lat.toString(), longitude: city.lng.toString() });
                          toast.success(`Localisation définie sur ${city.name}`);
                        }}
                        className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={manualLocation.latitude}
                      onChange={(e) => setManualLocation(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="33.5731"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={manualLocation.longitude}
                      onChange={(e) => setManualLocation(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-7.5898"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        if (manualLocation.latitude && manualLocation.longitude) {
                          setUserLocation({
                            latitude: parseFloat(manualLocation.latitude),
                            longitude: parseFloat(manualLocation.longitude)
                          });
                          toast.success('Localisation manuelle définie');
                        } else {
                          toast.error('Veuillez saisir la latitude et longitude');
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Définir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, search: value }));
              }}
              placeholder="Rechercher des deals..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  loadDeals();
                }
              }}
              onBlur={() => {
                // Only trigger search when user finishes typing and leaves the input
                if (filters.search && filters.search.trim()) {
                  loadDeals();
                }
              }}
            />
            <button
              onClick={() => {
                console.log('Search button clicked with filters:', filters);
                console.log('Category filter specifically:', filters.category);
                console.log('All filter keys:', Object.keys(filters));
                console.log('All filter values:', Object.values(filters));
                loadDeals();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Rechercher
            </button>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-3">
            <button
              onClick={() => {
                setFilters({
                  category: '',
                  min_price: '',
                  max_price: '',
                  min_discount: '',
                  status: '',
                  search: '',
                  radius: 10
                });
                setPagination(prev => ({ ...prev, current_page: 1 }));
                setTimeout(() => loadDeals(), 100);
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Effacer tous les filtres
            </button>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {showMyDeals ? 'My Deals' : showNearby ? 'Nearby Deals' : 'All Deals'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-gray-500">
                  {pagination.count} deals found
                </p>
                {stats.expired > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {stats.expired} expired
                  </span>
                )}
                {stats.upcoming > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stats.upcoming} upcoming
                  </span>
                )}
              </div>
            </div>
            
            {/* Status Summary */}
            {showMyDeals && (
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  Active: {stats.active} | Inactive: {stats.inactive}
                </div>
                <div className="text-xs text-gray-500">
                  Expired: {stats.expired} | Upcoming: {stats.upcoming}
                </div>
              </div>
            )}
          </div>
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
                <div className="mt-6 space-y-3">
                  <button
                    onClick={onCreateBusiness}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Créer mon premier établissement
                  </button>
                  <div className="text-sm text-gray-500">
                    💡 <strong>Conseil :</strong> Vous devez d'abord créer un établissement pour pouvoir créer des deals.
                  </div>
                 <button
                    onClick={onCreateDeal}
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
                 onViewDeal={onViewDeal}
                 onEditDeal={onEditDeal}
                 onDeleteDeal={onDeleteDeal}
                 onReactivateDeal={onReactivateDeal}
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
const DealCard = ({ deal, showMyDeals, dealsStore, loadDeals, onViewDeal, onEditDeal, onDeleteDeal, onReactivateDeal }) => {
  const status = DealService.getDealStatus(deal);
  const statusColor = DealService.getStatusColor(status);

  // Calculate days since expiration for expired deals
  const getExpirationInfo = (deal) => {
    if (status === 'expired') {
      const now = new Date();
      const endDate = new Date(deal.end_date);
      const daysSinceExpiration = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceExpiration === 0) {
        return 'Expired today';
      } else if (daysSinceExpiration === 1) {
        return 'Expired yesterday';
      } else {
        return `Expired ${daysSinceExpiration} days ago`;
      }
    }
    return null;
  };

  const expirationInfo = getExpirationInfo(deal);

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${status === 'expired' ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Deal Image */}
        <div className="flex-shrink-0">
          {console.log('Deal image field:', deal.image, 'Type:', typeof deal.image, 'Truthy:', !!deal.image)}
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
              <div className="flex items-center space-x-2">
              <h4 className={`text-lg font-medium truncate ${status === 'expired' ? 'text-red-700' : 'text-gray-900'}`}>
                {deal.title}
              </h4>
                {deal.search_priority && deal.search_priority === 1 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Exact Match
                  </span>
                )}
                {deal.search_priority && deal.search_priority === 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Title Match
                  </span>
                )}
                {deal.search_priority && deal.search_priority === 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Description Match
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {deal.business_name} • {deal.category_name}
              </p>
              <p className={`text-sm mt-2 line-clamp-2 ${status === 'expired' ? 'text-red-600' : 'text-gray-600'}`}>
                {deal.description}
              </p>
              
              {/* Expiration Warning for Expired Deals */}
              {status === 'expired' && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">
                      {expirationInfo}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end space-y-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </span>
              
              {/* Additional Status Info */}
              {status === 'expired' && (
                <span className="text-xs text-red-600 font-medium">
                  ⚠️ No longer valid
                </span>
              )}
            </div>
          </div>

          {/* Pricing and Details */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className={`line-through ${status === 'expired' ? 'text-red-400' : 'text-gray-500'}`}>
                  {DealService.formatPrice(deal.original_price)}
                </span>
                <span className={`ml-2 text-lg font-semibold ${status === 'expired' ? 'text-red-600' : 'text-green-600'}`}>
                  {DealService.formatPrice(deal.deal_price)}
                </span>
              </div>
              <div className={`text-sm ${status === 'expired' ? 'text-red-500' : 'text-gray-500'}`}>
                {deal.discount_percentage}% off
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <div className={status === 'expired' ? 'text-red-600 font-medium' : ''}>
                {status === 'expired' ? 'Expired: ' : 'Expires: '}
                {DealService.formatDate(deal.end_date)}
              </div>
              {showMyDeals && (
                <div>Uses: {deal.current_uses}/{deal.max_uses}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center space-x-3">
            {showMyDeals ? (
              <>
                {deal.is_active ? (
                  <>
                    <button
                      onClick={() => {
                        console.log('Edit clicked for deal:', deal.id, 'Full deal:', deal);
                        if (onEditDeal) {
                          onEditDeal(deal);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        console.log('Delete clicked for deal:', deal.id, 'Full deal:', deal);
                        if (onDeleteDeal) {
                          onDeleteDeal(deal.id);
                        } else {
                          // Fallback to direct store method
                          if (window.confirm('Êtes-vous sûr de vouloir désactiver ce deal ?')) {
                            dealsStore.deleteDeal(deal.id).then(() => {
                              toast.success('Deal désactivé avec succès');
                              if (showMyDeals) {
                                loadDeals();
                              }
                            }).catch((error) => {
                              console.error('Delete error:', error);
                              toast.error('Erreur lors de la désactivation du deal');
                            });
                          }
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Deactivate
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Reactivate clicked for deal:', deal.id, 'Full deal:', deal);
                      // Call the reactivate function
                      if (onReactivateDeal) {
                        onReactivateDeal(deal.id);
                      }
                    }}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Reactivate
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => onViewDeal && onViewDeal(deal)}
                className={`text-sm font-medium ${
                  status === 'expired' 
                    ? 'text-red-600 hover:text-red-800 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                disabled={status === 'expired'}
                title={status === 'expired' ? 'This deal has expired and is no longer available' : 'View deal details'}
              >
                {status === 'expired' ? 'Expired' : 'View Details'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsList;
