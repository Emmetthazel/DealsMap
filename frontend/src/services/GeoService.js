import BusinessService from './BusinessService.js';

class GeoService {
  /**
   * Get current user location using browser geolocation
   * @returns {Promise<Object>} - Promise resolving to {lat, lng}
   */
  static async getCurrentLocation() {
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
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} - Distance in kilometers
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} - Radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in kilometers
   * @returns {string} - Formatted distance string
   */
  static formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  /**
   * Find nearby businesses using current location
   * @param {number} radius - Search radius in kilometers
   * @param {Object} filters - Additional filters
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} - Nearby businesses
   */
  static async findNearbyBusinesses(radius = 10, filters = {}, page = 1, pageSize = 10) {
    try {
      const location = await this.getCurrentLocation();
      return await BusinessService.getNearbyBusinesses(
        location.lat,
        location.lng,
        radius,
        filters,
        page,
        pageSize
      );
    } catch (error) {
      throw new Error(`Failed to find nearby businesses: ${error.message}`);
    }
  }

  /**
   * Find nearby businesses using provided coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in kilometers
   * @param {Object} filters - Additional filters
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise} - Nearby businesses
   */
  static async findNearbyBusinessesByCoords(lat, lng, radius = 10, filters = {}, page = 1, pageSize = 10) {
    try {
      return await BusinessService.getNearbyBusinesses(
        lat,
        lng,
        radius,
        filters,
        page,
        pageSize
      );
    } catch (error) {
      throw new Error(`Failed to find nearby businesses: ${error.message}`);
    }
  }

  /**
   * Calculate distance from current location to a business
   * @param {string} businessId - Business ID
   * @returns {Promise} - Distance information
   */
  static async calculateDistanceToBusiness(businessId) {
    try {
      const location = await this.getCurrentLocation();
      return await BusinessService.calculateDistance(businessId, location.lat, location.lng);
    } catch (error) {
      throw new Error(`Failed to calculate distance: ${error.message}`);
    }
  }

  /**
   * Calculate distance from coordinates to a business
   * @param {string} businessId - Business ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise} - Distance information
   */
  static async calculateDistanceToBusinessByCoords(businessId, lat, lng) {
    try {
      return await BusinessService.calculateDistance(businessId, lat, lng);
    } catch (error) {
      throw new Error(`Failed to calculate distance: ${error.message}`);
    }
  }

  /**
   * Get directions between two points using Google Maps API
   * @param {number} fromLat - Starting latitude
   * @param {number} fromLng - Starting longitude
   * @param {number} toLat - Destination latitude
   * @param {number} toLng - Destination longitude
   * @param {string} mode - Travel mode (driving, walking, bicycling, transit)
   * @returns {Promise} - Directions data
   */
  static async getDirections(fromLat, fromLng, toLat, toLng, mode = 'driving') {
    // This would require Google Maps API key
    // For now, return basic direction info
    const distance = this.calculateDistance(fromLat, fromLng, toLat, toLng);
    
    return {
      distance: distance,
      formattedDistance: this.formatDistance(distance),
      mode: mode,
      // In a real implementation, this would call Google Maps Directions API
      directions: `Head ${this.getBearing(fromLat, fromLng, toLat, toLng)} for approximately ${this.formatDistance(distance)}`
    };
  }

  /**
   * Calculate bearing between two points
   * @param {number} lat1 - Starting latitude
   * @param {number} lng1 - Starting longitude
   * @param {number} lat2 - Destination latitude
   * @param {number} lng2 - Destination longitude
   * @returns {string} - Cardinal direction
   */
  static getBearing(lat1, lng1, lat2, lng2) {
    const dLng = this.toRadians(lng2 - lng1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x);
    const bearingDegrees = bearing * (180 / Math.PI);
    
    // Convert to cardinal directions
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const index = Math.round(bearingDegrees / 45) % 8;
    
    return directions[index];
  }

  /**
   * Validate coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} - True if coordinates are valid
   */
  static validateCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  /**
   * Get location from address using geocoding (placeholder)
   * @returns {Promise} - Geocoded coordinates
   */
  static async geocodeAddress() {
    // This would require a geocoding service like Google Maps Geocoding API
    // For now, return a placeholder
    throw new Error('Geocoding service not implemented. Please provide coordinates manually.');
  }

  /**
   * Get address from coordinates using reverse geocoding (placeholder)
   * @returns {Promise} - Reverse geocoded address
   */
  static async reverseGeocode() {
    // This would require a reverse geocoding service
    // For now, return a placeholder
    throw new Error('Reverse geocoding service not implemented.');
  }

  /**
   * Watch user location for changes
   * @param {Function} callback - Callback function for location updates
   * @param {Object} options - Watch options
   * @returns {number} - Watch ID for clearing
   */
  static watchLocation(callback, options = {}) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        // Silent error handling
      },
      { ...defaultOptions, ...options }
    );
  }

  /**
   * Clear location watch
   * @param {number} watchId - Watch ID from watchLocation
   */
  static clearLocationWatch(watchId) {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}

export default GeoService;
