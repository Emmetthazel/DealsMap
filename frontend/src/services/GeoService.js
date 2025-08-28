import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Geocoding service using OpenStreetMap Nominatim API
export const geocodeCity = async (cityName) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=8&addressdetails=1&featuretype=city`
    );
    
    if (response.data && response.data.length > 0) {
      const results = response.data.map(result => {
        // Extract clean city name from address components
        const address = result.address;
        let cleanCityName = cityName; // Default to search query
        
        // Try to get the cleanest city name possible
        if (address.city) {
          cleanCityName = address.city;
        } else if (address.town) {
          cleanCityName = address.town;
        } else if (address.village) {
          cleanCityName = address.village;
        } else if (address.county) {
          cleanCityName = address.county;
        } else if (address.state) {
          cleanCityName = address.state;
        }
        
        // If we still have the original search query, try to clean up the display name
        if (cleanCityName === cityName) {
          // Take first part of display name and clean it up
          const firstPart = result.display_name.split(',')[0];
          // Remove common administrative suffixes
          cleanCityName = firstPart
            .replace(/\s+(Prefecture|Province|Region|State|County|District|Municipality|City|Town|Village)$/i, '')
            .trim();
        }
        
        return {
          name: cleanCityName, // Clean city name for display
          fullName: result.display_name, // Full name for reference
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          type: result.type,
          importance: result.importance,
          country: address?.country || 'Unknown',
          state: address?.state || address?.province || address?.region || null
        };
      });
      
      // Sort by importance (most relevant first)
      results.sort((a, b) => b.importance - a.importance);
      
      // Remove duplicates based on clean city name
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r.name.toLowerCase() === result.name.toLowerCase())
      );
      
      return uniqueResults;
    }
    
    return [];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

// Search for neighborhoods/areas within a city
export const searchNeighborhoods = async (query, cityName = '') => {
  try {
    let searchQuery = query;
    if (cityName) {
      searchQuery = `${query}, ${cityName}`;
    }
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=6&addressdetails=1&featuretype=neighbourhood`
    );
    
    if (response.data && response.data.length > 0) {
      const results = response.data.map(result => ({
        name: result.display_name,
        shortName: result.display_name.split(',')[0],
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        type: result.type,
        city: result.address?.city || result.address?.town || result.address?.village || 'Unknown',
        country: result.address?.country || 'Unknown'
      }));
      
      return results;
    }
    
    return [];
  } catch (error) {
    console.error('Neighborhood search error:', error);
    return [];
  }
};

// Reverse geocoding to get city name from coordinates
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    
    if (response.data) {
      const address = response.data.address;
      return {
        city: address.city || address.town || address.village || address.county || 'Unknown',
        country: address.country || 'Unknown',
        fullAddress: response.data.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Calculate distance between two coordinates in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get nearby cities within a radius
export const getNearbyCities = async (latitude, longitude, radius = 50) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=8`
    );
    
    if (response.data) {
      const address = response.data.address;
      return {
        city: address.city || address.town || address.village || address.county || 'Unknown',
        region: address.state || address.province || 'Unknown',
        country: address.country || 'Unknown',
        coordinates: [parseFloat(response.data.lon), parseFloat(response.data.lat)]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting nearby cities:', error);
    return null;
  }
};

// Get current user location using browser geolocation
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
};

// Validate coordinates
export const validateCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// Convert degrees to radians
export const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
};
