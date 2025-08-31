import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, 
  Percent, 
  Clock, 
  Star, 
  Filter,
  ShoppingBag,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DealsListPanel = ({ 
  deals = [], 
  businesses = [], 
  filters = {}, 
  categories = [],
  sortBy: externalSortBy,
  onSortChange,
  onDealClick,
  onShowOnMap 
}) => {
  const [sortBy, setSortBy] = useState(externalSortBy || 'discount'); // discount, distance, rating, expiry
  
  // Sync internal sortBy with external sortBy
  useEffect(() => {
    if (externalSortBy && externalSortBy !== sortBy) {
      setSortBy(externalSortBy);
    }
  }, [externalSortBy, sortBy]);
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    if (onSortChange) {
      onSortChange(newSortBy);
    }
  };

  // Improved city extraction from address
  const extractCityFromAddress = (address) => {
    if (!address) return null;
    
    // Split by comma and look for the last part (usually the city)
    const parts = address.split(',').map(part => part.trim());
    
    // Common city patterns in Morocco
    const moroccanCities = [
      'rabat', 'casablanca', 'marrakech', 'fes', 'tangier', 'agadir', 'meknes', 'oujda',
      'kenitra', 'tetouan', 'safi', 'el jadida', 'beni mellal', 'taza', 'larache',
      'khemisset', 'skhirat', 'temara', 'sale', 'ifrane', 'azrou', 'midelt', 'errachidia'
    ];
    
    // Look for city names in the address parts
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].toLowerCase();
      
      // Check if this part contains a known city name
      for (const city of moroccanCities) {
        if (part.includes(city) || city.includes(part)) {
          return parts[i]; // Return the original part (with proper casing)
        }
      }
      
      // If no known city found, check if it looks like a city (not a street name)
      if (part.length <= 20 && !part.includes('avenue') && !part.includes('street') && 
          !part.includes('boulevard') && !part.includes('route') && !part.includes('123') &&
          !part.includes('456') && !part.includes('789') && !part.includes('000')) {
        return parts[i];
      }
    }
    
    // Fallback: return the last part if it's not too long
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length <= 20) {
      return lastPart;
    }
    
    return null;
  };

  // Filter deals based on current filters
  const filteredDeals = useMemo(() => {
    let filtered = [...deals];
    


    // Filter by city (use proper city field from business or business_location)
    if (filters.city) {
      filtered = filtered.filter(deal => {
        // Check different possible city field locations in order of preference
        const city = deal.business?.city || 
                    deal.business_location?.city || 
                    deal.city ||
                    (deal.business_address && extractCityFromAddress(deal.business_address)); // Improved address parsing
        
        if (!city) {
          return false;
        }
        
        // Clean the city name and compare
        const cleanCity = city.toLowerCase().trim();
        const filterCity = filters.city.toLowerCase().trim();
        
        // Check if the city matches (exact match or contains)
        const cityMatch = cleanCity.includes(filterCity) || filterCity.includes(cleanCity);
        
        return cityMatch;
      });
    }

    // Filter by neighborhood (use proper neighborhood field from business or business_location)
    if (filters.neighborhood) {
      filtered = filtered.filter(deal => {
        // Check different possible neighborhood field locations in order of preference
        const neighborhood = deal.business?.neighborhood || 
                           deal.business_location?.neighborhood || 
                           deal.neighborhood ||
                           (deal.business_address && deal.business_address.split(',')[1]?.trim()); // Fallback to second part of address
        
        if (!neighborhood) {
          console.log('❌ Deal has no neighborhood field:', deal);
          return false;
        }
        
        // Clean the neighborhood name and compare
        const cleanNeighborhood = neighborhood.toLowerCase().trim();
        const filterNeighborhood = filters.neighborhood.toLowerCase().trim();
        
        const neighborhoodMatch = cleanNeighborhood.includes(filterNeighborhood) || 
                                filterNeighborhood.includes(cleanNeighborhood);
        
        return neighborhoodMatch;
      });
    }

    // Filter by categories
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      filtered = filtered.filter(deal => {
        // Get the deal's category information
        const dealCategoryId = deal.business?.category?.id || deal.business?.category_id || deal.category_id;
        const dealCategoryName = deal.business?.category?.name || deal.business?.category_name || deal.category_name;
        
        // Check if any of the selected category IDs match the deal's category ID
        const categoryIdMatch = dealCategoryId && filters.selectedCategories.includes(dealCategoryId);
        
        if (categoryIdMatch) {
          return true;
        }
        
        // If no ID match, try to match by category name
        if (dealCategoryName) {
          // Get the names of selected categories
          const selectedCategoryNames = categories
            .filter(cat => filters.selectedCategories.includes(cat.id))
            .map(cat => cat.name.toLowerCase());
          
          // Check if the deal's category name matches any selected category name
          const categoryNameMatch = selectedCategoryNames.some(selectedCatName => 
            dealCategoryName.toLowerCase().includes(selectedCatName) ||
            selectedCatName.includes(dealCategoryName.toLowerCase())
          );
          
          if (categoryNameMatch) {
            return true;
          }
        }
        
        return false;
      });
    }

    // Filter by discount range
    if (filters.minDiscount > 0 || filters.maxDiscount < 100) {
      filtered = filtered.filter(deal => {
        const discount = deal.discount_percentage || 0;
        const discountMatch = discount >= filters.minDiscount && discount <= filters.maxDiscount;
        return discountMatch;
      });
    }

    // Filter by deals only (only apply if explicitly set to true)
    if (filters.hasDeals === true) {
      filtered = filtered.filter(deal => {
        const hasDeal = deal.discount_percentage > 0;
        return hasDeal;
      });
    }

    // Filter by expiry (only apply if explicitly set to a restrictive value)
    if (filters.expiresInDays && filters.expiresInDays < 90) {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (filters.expiresInDays * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(deal => {
        if (!deal.end_date) return true; // No expiry date, show it
        const dealExpiry = new Date(deal.end_date);
        const expiryMatch = dealExpiry <= expiryDate;
        return expiryMatch;
      });
    }

    // Filter by rating
    if (filters.minRating > 0 || filters.maxRating < 5) {
      console.log('🔍 Rating filter active:', { minRating: filters.minRating, maxRating: filters.maxRating });
      const beforeCount = filtered.length;
      filtered = filtered.filter(deal => {
        const rating = deal.average_rating || 0;
        console.log(`🔍 Checking deal "${deal.title}": rating ${rating}, range [${filters.minRating}, ${filters.maxRating}]`);
        
        // Handle deals with no rating (0) - they should be included if minRating is 0
        if (rating === 0 && filters.minRating === 0) {
          console.log(`🔍 Deal "${deal.title}" included: rating 0 with minRating 0`);
          return true;
        }
        
        const ratingMatch = rating >= filters.minRating && rating <= filters.maxRating;
        if (!ratingMatch) {
          console.log(`🔍 Deal "${deal.title}" filtered out: rating ${rating} not in range [${filters.minRating}, ${filters.maxRating}]`);
        } else {
          console.log(`🔍 Deal "${deal.title}" included: rating ${rating} in range [${filters.minRating}, ${filters.maxRating}]`);
        }
        return ratingMatch;
      });
      console.log(`🔍 Rating filter: ${beforeCount} → ${filtered.length} deals`);
    }

    // Filter by expiring soon deals
    if (filters.showExpiringSoon) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(deal => {
        if (!deal.end_date) return false; // Must have an expiry date
        const expiryDate = new Date(deal.end_date);
        return expiryDate <= sevenDaysFromNow && expiryDate > now;
      });
    }

    // Filter by open now - check actual business opening hours
    if (filters.openNow) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Convert current day number to day name
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[currentDay];
      
      console.log(`🏪 Open now filter: Current time ${currentHour}:00, day: ${currentDayName}`);
      
      filtered = filtered.filter(deal => {
        // Get business opening hours from the deal
        const business = businesses.find(b => b.id === deal.business?.id || b.name === deal.business_name);
        if (!business || !business.opening_hours) {
          console.log(`🏪 Deal "${deal.title}": No business or opening hours data`);
          return false; // No opening hours data, filter out
        }
        
        const todayHours = business.opening_hours[currentDayName];
        if (!todayHours || !todayHours.open || !todayHours.close) {
          console.log(`🏪 Deal "${deal.title}": No hours for ${currentDayName}`);
          return false; // No hours for today, filter out
        }
        
        // Parse opening and closing hours
        const openHour = parseInt(todayHours.open.split(':')[0]);
        const closeHour = parseInt(todayHours.close.split(':')[0]);
        
        // Check if business is currently open
        const isOpen = currentHour >= openHour && currentHour < closeHour;
        
        console.log(`🏪 Deal "${deal.title}": ${todayHours.open}-${todayHours.close}, current: ${currentHour}:00, open: ${isOpen}`);
        
        return isOpen;
      });
      
      console.log(`🏪 After open now filter: ${filtered.length} deals`);
    }

    // If no filters are applied, show all deals
    if (filtered.length === 0 && deals.length > 0) {
      const hasActiveFilters = filters.city || filters.neighborhood || 
                              (filters.selectedCategories && filters.selectedCategories.length > 0) ||
                              filters.minDiscount > 0 || filters.maxDiscount < 100 ||
                              filters.hasDeals === true || 
                              (filters.expiresInDays && filters.expiresInDays < 90) ||
                              filters.minRating > 0 || filters.maxRating < 5 ||
                              filters.showExpiringSoon || filters.openNow;
      
      if (!hasActiveFilters) {
        return deals;
      }
    }
    
    return filtered;
  }, [deals, filters]);

  // Sort deals
  const sortedDeals = useMemo(() => {
    const sorted = [...filteredDeals];
    
    switch (sortBy) {
      case 'discount':
        return sorted.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
      case 'distance':
        // TODO: Implement distance sorting when location is available
        return sorted;
      case 'rating':
        return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'expiry':
        return sorted.sort((a, b) => {
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date) - new Date(b.end_date);
        });
      default:
        return sorted;
    }
  }, [filteredDeals, sortBy]);

  // Calculate distance from selected location
  const calculateDistance = (deal) => {
    if (!filters.cityCoordinates && !filters.neighborhoodCoordinates) return null;
    
    const coordinates = filters.cityCoordinates || filters.neighborhoodCoordinates;
    // Check different possible coordinate field locations
    const dealCoords = [
      deal.business?.longitude || deal.business_location?.longitude || deal.longitude,
      deal.business?.latitude || deal.business_location?.latitude || deal.latitude
    ];
    
    if (!dealCoords[0] || !dealCoords[1]) return null;
    
    // Simple distance calculation (Haversine formula would be better)
    const lat1 = coordinates[1];
    const lon1 = coordinates[0];
    const lat2 = dealCoords[1];
    const lon2 = dealCoords[0];
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  // Format expiry date
  const formatExpiry = (expiryDate) => {
    if (!expiryDate) return 'No expiry';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `Expires in ${diffDays} days`;
    if (diffDays < 30) return `Expires in ${Math.ceil(diffDays / 7)} weeks`;
    return `Expires in ${Math.ceil(diffDays / 30)} months`;
  };

  const handleDealClick = (deal) => {
    if (onDealClick) {
      onDealClick(deal);
    }
  };

  const handleShowOnMap = (deal) => {
    if (onShowOnMap) {
      onShowOnMap(deal);
    }
  };

  if (filteredDeals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 m-4">
        <div className="text-center text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No deals found</h3>
          <p className="text-sm">
            {filters.city || filters.neighborhood || filters.selectedCategories.length > 0
              ? 'Try adjusting your filters or expanding your search area'
              : 'No deals available in this area'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg m-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Deals ({filteredDeals.length})
              </h3>
              <p className="text-sm text-gray-500">
                {filters.city && `in ${filters.city}`}
                {filters.neighborhood && ` • ${filters.neighborhood}`}
                {filters.selectedCategories.length > 0 && ` • ${filters.selectedCategories.length} categories`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="discount">Sort by Discount</option>
              <option value="rating">Sort by Rating</option>
              <option value="expiry">Sort by Expiry</option>
            </select>
            

          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="flex-1 overflow-y-auto">
        {sortedDeals.map((deal) => (
          <div
            key={deal.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleDealClick(deal)}
          >
            <div className="flex items-start gap-3">
              {/* Deal Image */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                {deal.image ? (
                  <img 
                    src={deal.image} 
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Tag className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Deal Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900 truncate">{deal.title}</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <Percent className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-600">{deal.discount_percentage}%</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{deal.description}</p>

                {/* Price Display - Compact */}
                <div className="flex items-center gap-2 mt-2 mb-2">
                  {deal.deal_price && (
                    <span className="text-sm font-semibold text-green-600">
                      {deal.deal_price} DH
                    </span>
                  )}
                  {deal.original_price && (
                    <span className="text-xs text-gray-500 line-through">
                      {deal.original_price} DH
                    </span>
                  )}
                </div>

                {/* Rating Display - Prominent */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {deal.average_rating ? `${deal.average_rating.toFixed(1)}` : '0.0'} 
                      ({deal.review_count || 0})
                    </span>
                  </div>
                </div>

                {/* Business Info */}
                 <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                   <div className="flex items-center gap-1">
                     <MapPin className="w-3 h-3" />
                     <span>{deal.business?.name || deal.business_name}</span>
                   </div>
                   
                   {(deal.business?.category || deal.category_name) && (
                     <div className="flex items-center gap-1">
                       <Tag className="w-3 h-3" />
                       <span>{deal.business?.category?.name || deal.category_name}</span>
                     </div>
                   )}
                   

                 </div>

                {/* Additional Info */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                     {deal.end_date && (
                     <div className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       <span className={new Date(deal.end_date) < new Date() ? 'text-red-500' : ''}>
                         {formatExpiry(deal.end_date)}
                       </span>
                     </div>
                   )}
                  
                  {calculateDistance(deal) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{calculateDistance(deal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowOnMap(deal);
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Show on Map
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add to favorites or share
                  toast.success('Feature coming soon!');
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="text-center text-sm text-gray-500">
          Showing {filteredDeals.length} of {deals.length} total deals
          {filters.city && ` in ${filters.city}`}
          {filters.neighborhood && ` near ${filters.neighborhood}`}
        </div>
      </div>
    </div>
  );
};

export default DealsListPanel;
