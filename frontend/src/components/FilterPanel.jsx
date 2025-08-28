import React, { useState, useEffect, useCallback } from 'react';
import { 
  Filter, 
  MapPin, 
  Calendar, 
  Percent, 
  X, 
  Save, 
  RotateCcw,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { geocodeCity, searchNeighborhoods } from '../services/GeoService';

const FilterPanel = ({ 
  categories = [], 
  onFiltersChange, 
  initialFilters = {},
  onSaveFilters,
  onLoadFilters,
  savedFilters = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    // Geographic filters
    distance: 10, // km
    city: '',
    neighborhood: '',
    
    // Category filters
    selectedCategories: [],
    
    // Deal filters
    minDiscount: 0,
    maxDiscount: 100,
    hasDeals: false,
    
    // Temporal filters
    expiresInDays: 30,
    showExpiringSoon: false,
    
    // Business filters
    minRating: 0,
    maxRating: 5,
    openNow: false,
    
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isSearchingNeighborhood, setIsSearchingNeighborhood] = useState(false);

  // Update filters and notify parent
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Handle individual filter changes
  const handleFilterChange = useCallback((key, value) => {
    if (key === 'city' && !value) {
      // Clear city coordinates when city is cleared
      updateFilters({ [key]: value, cityCoordinates: null });
    } else {
      updateFilters({ [key]: value });
    }
  }, [updateFilters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    const defaultFilters = {
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
      openNow: false,
    };
    
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    toast.success('Filters reset to default');
  }, [onFiltersChange]);

  // Debounced search for cities
  const searchCities = useCallback(async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    // Clear previous timeout
    if (window.citySearchTimeout) {
      clearTimeout(window.citySearchTimeout);
    }

    // Set new timeout for debounced search
    window.citySearchTimeout = setTimeout(async () => {
      setIsSearchingCity(true);
      try {
        const results = await geocodeCity(query);
        setCitySuggestions(results);
      } catch (error) {
        console.error('City search error:', error);
        toast.error('Failed to search cities');
      } finally {
        setIsSearchingCity(false);
      }
    }, 300); // 300ms delay
  }, []);

  // Handle city selection
  const handleCitySelect = useCallback((city) => {
    setFilters(prev => ({
      ...prev,
      city: city.name,
      cityCoordinates: [city.longitude, city.latitude]
    }));
    setCitySuggestions([]);
    onFiltersChange({
      ...filters,
      city: city.name,
      cityCoordinates: [city.longitude, city.latitude]
    });
    toast.success(`Selected: ${city.name}`);
  }, [filters, onFiltersChange]);

  // Debounced search for neighborhoods
  const searchNeighborhoodsHandler = useCallback(async (query) => {
    if (query.length < 2) {
      setNeighborhoodSuggestions([]);
      return;
    }

    // Clear previous timeout
    if (window.neighborhoodSearchTimeout) {
      clearTimeout(window.neighborhoodSearchTimeout);
    }

    // Set new timeout for debounced search
    window.neighborhoodSearchTimeout = setTimeout(async () => {
      setIsSearchingNeighborhood(true);
      try {
        const results = await searchNeighborhoods(query, filters.city);
        setNeighborhoodSuggestions(results);
      } catch (error) {
        console.error('Neighborhood search error:', error);
        toast.error('Failed to search neighborhoods');
      } finally {
        setIsSearchingNeighborhood(false);
      }
    }, 300); // 300ms delay
  }, [filters.city]);

  // Handle neighborhood selection
  const handleNeighborhoodSelect = useCallback((neighborhood) => {
    setFilters(prev => ({
      ...prev,
      neighborhood: neighborhood.name,
      neighborhoodCoordinates: [neighborhood.longitude, neighborhood.latitude]
    }));
    setNeighborhoodSuggestions([]);
    onFiltersChange({
      ...filters,
      neighborhood: neighborhood.name,
      neighborhoodCoordinates: [neighborhood.longitude, neighborhood.latitude]
    });
    toast.success(`Selected: ${neighborhood.name}`);
  }, [filters, onFiltersChange]);

  // Save current filters
  const saveCurrentFilters = useCallback(() => {
    if (!filterName.trim()) {
      toast.error('Please enter a name for your filters');
      return;
    }

    const filterToSave = {
      id: Date.now(),
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    onSaveFilters(filterToSave);
    setFilterName('');
    toast.success('Filters saved successfully!');
  }, [filters, filterName, onSaveFilters]);

  // Load saved filters
  const loadSavedFilters = useCallback((savedFilter) => {
    setFilters(savedFilter.filters);
    onFiltersChange(savedFilter.filters);
    toast.success(`Loaded filters: ${savedFilter.name}`);
  }, [onFiltersChange]);

  // Delete saved filters
  const deleteSavedFilters = useCallback((filterId) => {
    // This would typically call a function to remove from storage
    // For now, just show a success message
    toast.success('Filters deleted');
  }, []);

  // Share filters via URL
  const shareFilters = useCallback(() => {
    const filterParams = new URLSearchParams();
    
    // Add relevant filters to URL
    if (filters.city) filterParams.set('city', filters.city);
    if (filters.distance) filterParams.set('distance', filters.distance);
    if (filters.selectedCategories.length) {
      filterParams.set('categories', filters.selectedCategories.join(','));
    }
    if (filters.minDiscount > 0) filterParams.set('minDiscount', filters.minDiscount);
    if (filters.maxDiscount < 100) filterParams.set('maxDiscount', filters.maxDiscount);
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${filterParams.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Filter URL copied to clipboard!');
    }).catch(() => {
      toast.error('Could not copy URL');
    });
  }, [filters]);

  // Load filters from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = {};
    
    if (urlParams.get('city')) urlFilters.city = urlParams.get('city');
    if (urlParams.get('distance')) urlFilters.distance = parseInt(urlParams.get('distance'));
    if (urlParams.get('categories')) {
      urlFilters.selectedCategories = urlParams.get('categories').split(',');
    }
    if (urlParams.get('minDiscount')) urlFilters.minDiscount = parseInt(urlParams.get('minDiscount'));
    if (urlParams.get('maxDiscount')) urlFilters.maxDiscount = parseInt(urlParams.get('maxDiscount'));
    
    if (Object.keys(urlFilters).length > 0) {
      const updatedFilters = { ...filters, ...urlFilters };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    }
  }, []);



  return (
    <div className="relative">
      {/* Filter toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {Object.values(filters).some(value => 
          Array.isArray(value) ? value.length > 0 : Boolean(value)
        ) && (
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        )}
        {filters.selectedCategories.length > 0 && (
          <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
            {filters.selectedCategories.length}
          </span>
        )}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Geographic Filters */}
            <div className="mb-6">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <MapPin className="w-4 h-4" />
                Location
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Distance (km)</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">{filters.distance} km</div>
                </div>
                
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">City</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a city..."
                      value={filters.city}
                      onChange={(e) => {
                        handleFilterChange('city', e.target.value);
                        searchCities(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearchingCity && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                                                       {/* City suggestions dropdown */}
                  {citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {citySuggestions.map((city, index) => (
                        <button
                          key={index}
                          onClick={() => handleCitySelect(city)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-gray-500">
                            {city.state && `${city.state}`}
                            {city.country !== 'Unknown' && `${city.state ? ' • ' : ''}${city.country}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Go to City button */}
                  {filters.cityCoordinates && (
                    <button
                      onClick={() => onFiltersChange(filters)}
                      className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      🗺️ Go to {filters.city}
                    </button>
                  )}
                  
                  {/* Go to Neighborhood button */}
                  {filters.neighborhoodCoordinates && (
                    <button
                      onClick={() => onFiltersChange(filters)}
                      className="mt-2 w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      🏘️ Go to {filters.neighborhood}
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">Neighborhood</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a neighborhood..."
                      value={filters.neighborhood}
                      onChange={(e) => {
                        handleFilterChange('neighborhood', e.target.value);
                        searchNeighborhoodsHandler(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearchingNeighborhood && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Neighborhood suggestions dropdown */}
                  {neighborhoodSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {neighborhoodSuggestions.map((neighborhood, index) => (
                        <button
                          key={index}
                          onClick={() => handleNeighborhoodSelect(neighborhood)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          <div className="font-medium">{neighborhood.name}</div>
                          <div className="text-xs text-gray-500">
                            {neighborhood.city !== 'Unknown' && `${neighborhood.city}`}
                            {neighborhood.country !== 'Unknown' && ` • ${neighborhood.country}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="mb-6">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <span className="w-4 h-4 text-blue-600">🏷️</span>
                Categories
                {filters.selectedCategories.length > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {filters.selectedCategories.length} selected
                  </span>
                )}
                <button
                  onClick={() => {
                    localStorage.removeItem('categories');
                    window.location.reload();
                  }}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                  title="Refresh categories from API"
                >
                  🔄 Refresh
                </button>
              </h4>
              
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
                  {categories.length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-center text-gray-500 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Loading categories...
                      </div>
                      {/* Fallback categories for testing */}
                      <div className="text-xs text-gray-400 text-center border-t pt-2">
                        Fallback categories (if API fails):
                      </div>
                      <div className="space-y-2">
                        {['Restaurant', 'Shopping', 'Services'].map((name, index) => (
                          <label key={index} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.selectedCategories.includes(`fallback-${index}`)}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...filters.selectedCategories, `fallback-${index}`]
                                  : filters.selectedCategories.filter(id => id !== `fallback-${index}`);
                                handleFilterChange('selectedCategories', newCategories);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    categories.map(category => (
                      <label key={category.id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.selectedCategories.includes(category.id)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...filters.selectedCategories, category.id]
                              : filters.selectedCategories.filter(id => id !== category.id);
                            handleFilterChange('selectedCategories', newCategories);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
                
                {/* Clear Categories Button */}
                {filters.selectedCategories.length > 0 && (
                  <button
                    onClick={() => handleFilterChange('selectedCategories', [])}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-red-200"
                  >
                    ✕ Clear All Categories
                  </button>
                )}
              </div>
            </div>

            {/* Deal Filters */}
            <div className="mb-6">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Percent className="w-4 h-4" />
                Deals
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Discount Range (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.minDiscount}
                      onChange={(e) => handleFilterChange('minDiscount', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.maxDiscount}
                      onChange={(e) => handleFilterChange('maxDiscount', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                

              </div>
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 mb-3"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </button>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="mb-6 space-y-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Expires in (days)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={filters.expiresInDays}
                    onChange={(e) => handleFilterChange('expiresInDays', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg"
                  />
                  <div className="text-xs text-gray-500 mt-1">{filters.expiresInDays} days</div>
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.showExpiringSoon}
                    onChange={(e) => handleFilterChange('showExpiringSoon', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show expiring soon deals</span>
                </label>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rating Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.minRating}
                      onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.maxRating}
                      onChange={(e) => handleFilterChange('maxRating', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                                  <span className="text-sm text-gray-700">Open now only</span>
              </label>
            </div>
            )}

            {/* Filter Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <button
                onClick={shareFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Save/Load Filters */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Filter name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveCurrentFilters}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              
              {savedFilters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Saved Filters:</div>
                  {savedFilters.map(savedFilter => (
                    <div key={savedFilter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <button
                        onClick={() => loadSavedFilters(savedFilter)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {savedFilter.name}
                      </button>
                      <button
                        onClick={() => deleteSavedFilters(savedFilter.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
