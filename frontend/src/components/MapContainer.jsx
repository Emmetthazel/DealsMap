import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';
import { Cluster } from 'ol/source';
import { click } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import { defaults as defaultControls, FullScreen, Zoom, ZoomSlider } from 'ol/control';
import { toast } from 'react-hot-toast';
import { MapPin, Navigation, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { reverseGeocode } from '../services/GeoService';

const MapContainer = ({ 
  businesses = [], 
  deals = [], 
  onMarkerClick, 
  center = [-6.8498, 34.0209], // Rabat, Morocco default
  zoom = 12,
  onZoomChange,
  selectedLocation,
  highlightedDeal = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const locationWatcherRef = useRef(null);

  // Create marker features from businesses and deals
  const createMarkerFeatures = useCallback(() => {
    const features = [];
    
    // Add business markers
    businesses.forEach(business => {
      if (business.latitude && business.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([business.longitude, business.latitude])),
          type: 'business',
          data: business,
          name: business.name,
          category: business.category?.name || 'Unknown'
        });
        features.push(feature);
      }
    });

    // Add deal markers
    deals.forEach(deal => {
      if (deal.business?.latitude && deal.business?.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([deal.business.longitude, deal.business.latitude])),
          type: 'deal',
          data: deal,
          name: deal.title,
          category: deal.business.category?.name || 'Unknown',
          discount: deal.discount_percentage
        });
        features.push(feature);
      }
    });

    // Add selected location marker if available
    if (selectedLocation && selectedLocation.coordinates) {
      const selectedFeature = new Feature({
        geometry: new Point(fromLonLat(selectedLocation.coordinates)),
        type: 'selected',
        name: selectedLocation.name,
        locationType: selectedLocation.type
      });
      features.push(selectedFeature);
    }

    // Add highlighted deal marker if available
    if (highlightedDeal) {
      const latitude = highlightedDeal.business?.latitude || highlightedDeal.business_location?.latitude || highlightedDeal.latitude;
      const longitude = highlightedDeal.business?.longitude || highlightedDeal.business_location?.longitude || highlightedDeal.longitude;
      
      if (latitude && longitude) {
        const highlightedFeature = new Feature({
          geometry: new Point(fromLonLat([longitude, latitude])),
          type: 'highlighted',
          name: highlightedDeal.title,
          data: highlightedDeal
        });
        features.push(highlightedFeature);
      }
    }

    // Add user location marker if available
    if (userLocation) {
      const userFeature = new Feature({
        geometry: new Point(fromLonLat(userLocation)),
        type: 'user',
        name: 'Your Location',
        data: { type: 'user_location' }
      });
      features.push(userFeature);
    }

    return features;
  }, [businesses, deals, selectedLocation, highlightedDeal, userLocation]);

  // Create marker styles
  const createMarkerStyle = useCallback((feature) => {
    const type = feature.get('type');
    const category = feature.get('category');
    const discount = feature.get('discount');
    
    let color = '#3B82F6'; // Default blue
    let icon = '🏪'; // Default business icon
    
    // Special styling for highlighted deal
    if (type === 'highlighted') {
      color = '#10B981'; // Bright green
      icon = '⭐';
    }
    // Special styling for selected location
    else if (type === 'selected') {
      color = '#F59E0B'; // Bright orange
      icon = '🎯';
    }
    // Special styling for user location
    else if (type === 'user') {
      color = '#DC2626'; // Red
      icon = '📍';
    }
    // Color coding by category
    else if (category === 'Restaurant') {
      color = '#EF4444'; // Red
      icon = '🍽️';
    } else if (category === 'Shopping') {
      color = '#10B981'; // Green
      icon = '🛍️';
    } else if (category === 'Entertainment') {
      color = '#8B5CF6'; // Purple
      icon = '🎮';
    } else if (category === 'Health') {
      color = '#06B6D4'; // Cyan
      icon = '🏥';
    }
    
    // Special styling for deals
    if (type === 'deal' && discount) {
      color = '#F59E0B'; // Orange for deals
      icon = '🔥';
    }

    return new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${icon}</text>
        </svg>`,
        scale: type === 'selected' ? 1.2 : 1, // Make selected location marker slightly larger
        anchor: [0.5, 1]
      }),
      text: new Text({
        text: feature.get('name'),
        font: type === 'selected' ? '14px Arial' : '12px Arial', // Larger text for selected location
        fill: new Fill({ color: type === 'selected' ? '#F59E0B' : '#1F2937' }), // Orange text for selected location
        stroke: new Stroke({ color: 'white', width: 2 }),
        offsetY: type === 'selected' ? -50 : -40 // Adjust offset for larger marker
      })
    });
  }, []);

  // Refresh map when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      const features = createMarkerFeatures();
      const vectorSource = mapInstanceRef.current.getLayers().getArray()
        .find(layer => layer instanceof VectorLayer)?.getSource();
      
      if (vectorSource) {
        vectorSource.clear();
        features.forEach(feature => vectorSource.addFeature(feature));
      }
    }
  }, [userLocation, createMarkerFeatures]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create vector source with clustering
    const features = createMarkerFeatures();
    const vectorSource = new VectorSource({
      features: features
    });

    // Create clustered source
    const clusterSource = new Cluster({
      distance: 50,
      source: vectorSource
    });

    // Create vector layer for markers
    const vectorLayer = new VectorLayer({
      source: clusterSource,
      style: (feature) => {
        const features = feature.get('features');
        if (features.length === 1) {
          return createMarkerStyle(features[0]);
        }
        
        // Cluster style
        const size = Math.min(features.length * 2 + 20, 50);
        return new Style({
          image: new Icon({
            src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <text x="${size/2}" y="${size/2+4}" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${features.length}</text>
            </svg>`,
            scale: 1,
            anchor: [0.5, 0.5]
          })
        });
      }
    });

    // Create map instance
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: [] // Remove OpenStreetMap attribution
          })
        }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
        maxZoom: 18,
        minZoom: 5
      }),
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attribution: false // Disable attribution control
      }).extend([
        new Zoom({
          className: 'custom-zoom-control'
        }),
        new ZoomSlider({
          className: 'custom-zoom-slider'
        }),
        new FullScreen({
          className: 'custom-fullscreen-control'
        })
      ])
    });

    // Add click interaction
    const select = new Select({
      condition: click,
      style: null
    });

    map.addInteraction(select);

    // Handle marker clicks
    select.on('select', (event) => {
      const feature = event.selected[0];
      if (feature) {
        const features = feature.get('features');
        if (features && features.length === 1) {
          const singleFeature = features[0];
          if (onMarkerClick) {
            onMarkerClick(singleFeature.get('data'), singleFeature.get('type'));
          }
        }
      }
    });

    // Store map instance
    mapInstanceRef.current = map;

  // Listen for fullscreen changes
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);

      // Cleanup
  return () => {
    if (map) {
      map.setTarget(undefined);
    }
    // Remove fullscreen event listeners
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
  };
  }, [center, zoom, createMarkerFeatures, createMarkerStyle, onMarkerClick]);

  // Update markers when data changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const features = createMarkerFeatures();
      
      // Add user location marker if available
      if (userLocation) {
        const userFeature = new Feature({
          geometry: new Point(fromLonLat(userLocation)),
          type: 'user',
          name: 'Your Location'
        });
        features.push(userFeature);
      }
      
      const vectorSource = mapInstanceRef.current.getLayers().getArray()[1].getSource().getSource();
      vectorSource.clear();
      vectorSource.addFeatures(features);
    }
  }, [businesses, deals, createMarkerFeatures, userLocation]);

  // Update zoom when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.getView) {
      const view = mapInstanceRef.current.getView();
      const currentZoom = view.getZoom();
      
      if (currentZoom !== zoom) {
        view.animate({
          zoom: zoom,
          duration: 800,
          easing: 'easeOut'
        });
      }
    }
  }, [zoom]);

  // Update zoom state and notify parent
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.getView) {
      const view = mapInstanceRef.current.getView();
      
      const handleZoomChange = () => {
        const newZoom = view.getZoom();
        setCurrentZoom(newZoom);
        if (onZoomChange) {
          onZoomChange(newZoom);
        }
      };
      
      view.on('change:resolution', handleZoomChange);
      
      return () => {
        view.un('change:resolution', handleZoomChange);
      };
    }
  }, [onZoomChange]);

  // Get user location with improved accuracy
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your precise location...');
    
    let bestAccuracy = Infinity;
    let bestPosition = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    // High accuracy options for GPS
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 45000,           // 45 seconds for GPS
      maximumAge: 0,            // No cached location
      forceRequest: true
    };
    
    // Standard accuracy options as fallback
    const standardOptions = {
      enableHighAccuracy: false,
      timeout: 20000,           // 20 seconds for network
      maximumAge: 60000,        // Allow 1 minute old cache
      forceRequest: false
    };
    
    const processPosition = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      attempts++;
      
      console.log(`Location attempt ${attempts}:`, { latitude, longitude, accuracy, bestAccuracy });
      
      // Update if this is the best accuracy so far
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestPosition = position;
        
        // Update map immediately with better position
        setUserLocation([longitude, latitude]);
        setLocationAccuracy(accuracy);
        
        if (mapInstanceRef.current) {
          const view = mapInstanceRef.current.getView();
          view.animate({
            center: fromLonLat([longitude, latitude]),
            zoom: accuracy < 10 ? 18 : accuracy < 50 ? 17 : 16, // Zoom based on accuracy
            duration: 1000
          });
        }
        
        // Show progress toast
        if (accuracy < 10) {
          toast.success(`Excellent accuracy! ${Math.round(accuracy)}m`);
        } else if (accuracy < 25) {
          toast.success(`Good accuracy! ${Math.round(accuracy)}m`);
        } else if (accuracy < 100) {
          toast.success(`Fair accuracy: ${Math.round(accuracy)}m`);
        } else {
          toast.success(`Location found: ${Math.round(accuracy)}m`);
        }
      }
      
      // If we have good accuracy or max attempts, stop
      if (bestAccuracy < 20 || attempts >= maxAttempts) {
        if (bestPosition) {
          const { latitude, longitude } = bestPosition.coords;
          
          // Get city name from best position
          try {
            const cityInfo = await reverseGeocode(latitude, longitude);
            if (cityInfo && cityInfo.city !== 'Unknown') {
              console.log('Final city:', cityInfo.city);
              toast.success(`📍 Location in ${cityInfo.city} (${Math.round(bestAccuracy)}m accuracy)`);
            } else {
              toast.success(`📍 Location found (${Math.round(bestAccuracy)}m accuracy)`);
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            toast.success(`📍 Location found (${Math.round(bestAccuracy)}m accuracy)`);
          }
        }
        return;
      }
      
      // Try again with standard accuracy if needed
      if (attempts < maxAttempts && bestAccuracy > 50) {
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            processPosition,
            handleLocationError,
            standardOptions
          );
        }, 2000); // Wait 2 seconds before next attempt
      }
    };
    
    const handleLocationError = (error) => {
      console.error('Location error:', error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        let errorMessage = 'Could not get precise location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please check GPS and try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        toast.error(errorMessage);
        return;
      }
      
      // Try standard accuracy as fallback
      if (attempts < maxAttempts) {
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            processPosition,
            handleLocationError,
            standardOptions
          );
        }, 1000);
      }
    };
    
    // Start with high accuracy GPS
    navigator.geolocation.getCurrentPosition(
      processPosition,
      handleLocationError,
      highAccuracyOptions
    );
    
    // Start continuous monitoring for better accuracy
    startLocationMonitoring();
  }, []);
  
  // Start continuous location monitoring
  const startLocationMonitoring = useCallback(() => {
    if (!navigator.geolocation || locationWatcherRef.current) return;
    
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000 // Allow 10 second old positions
    };
    
    locationWatcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Only update if we get better accuracy
        if (!locationAccuracy || accuracy < locationAccuracy) {
          setUserLocation([longitude, latitude]);
          setLocationAccuracy(accuracy);
          console.log('Location improved:', { accuracy, previous: locationAccuracy });
          
          // Show improvement toast
          if (accuracy < 10) {
            toast.success(`🎯 GPS accuracy improved to ${Math.round(accuracy)}m!`);
          } else if (accuracy < 25 && accuracy < (locationAccuracy || Infinity)) {
            toast.success(`🎯 Location accuracy improved to ${Math.round(accuracy)}m!`);
          }
        }
      },
      (error) => {
        console.log('Watch position error:', error);
        // Don't show error for watch position, just log it
      },
      watchOptions
    );
    
    setIsLocationActive(true);
  }, [locationAccuracy]);
  
  // Stop location monitoring
  const stopLocationMonitoring = useCallback(() => {
    if (locationWatcherRef.current) {
      navigator.geolocation.clearWatch(locationWatcherRef.current);
      locationWatcherRef.current = null;
      setIsLocationActive(false);
    }
  }, []);
  
  // Cleanup location monitoring on unmount
  useEffect(() => {
    return () => {
      stopLocationMonitoring();
    };
  }, [stopLocationMonitoring]);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.animate({
        center: fromLonLat(userLocation),
        zoom: 15,
        duration: 1000
      });
    } else {
      getUserLocation();
    }
  }, [userLocation, getUserLocation]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (mapRef.current?.requestFullscreen) {
        mapRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (mapRef.current?.webkitRequestFullscreen) {
        mapRef.current.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (mapRef.current?.msRequestFullscreen) {
        mapRef.current.msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        setIsFullscreen(false);
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.animate({
        zoom: view.getZoom() + 1,
        duration: 200
      });
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      view.animate({
        zoom: view.getZoom() - 1,
        duration: 200
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full">
            {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-lg"
      />
      
      {/* Floating Location Pin (Google Maps style) */}
      {selectedLocation && !userLocation && (
        <div className="absolute pointer-events-none" style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 1000
        }}>
          {/* Pin shadow */}
          <div className="w-6 h-3 bg-black opacity-20 rounded-full transform translate-y-2"></div>
          
          {/* Main pin */}
          <div className="relative">
            {/* Pin body */}
            <div className="w-8 h-12 bg-red-500 rounded-t-full shadow-lg border-2 border-white">
              {/* Pin highlight */}
              <div className="w-4 h-6 bg-red-400 rounded-t-full mx-auto mt-1"></div>
            </div>
            
            {/* Pin point */}
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500 mx-auto"></div>
            
            {/* Location label */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-200 whitespace-nowrap">
              <div className="font-medium text-center">🎯 {selectedLocation.name}</div>
              <div className="text-gray-500 text-center text-xs">
                {selectedLocation.type === 'city' ? 'City Center' : 'Neighborhood Center'}
              </div>
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating User Location Pin */}
      {userLocation && (
        <div className="absolute pointer-events-none" style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 1000
        }}>
          {/* Pin shadow */}
          <div className="w-6 h-3 bg-black opacity-20 rounded-full transform translate-y-2"></div>
          
          {/* Main pin */}
          <div className="relative">
            {/* Pin body */}
            <div className="w-8 h-12 bg-blue-500 rounded-t-full shadow-lg border-2 border-white">
              {/* Pin highlight */}
              <div className="w-4 h-6 bg-blue-400 rounded-t-full mx-auto mt-1"></div>
            </div>
            
            {/* Pin point */}
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 mx-auto"></div>
            
            {/* Location label */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-200 whitespace-nowrap">
              <div className="font-medium text-center">📍 Your Location</div>
              <div className="text-gray-500 text-center text-xs">
                {locationAccuracy ? `Accuracy: ${Math.round(locationAccuracy)}m` : 'GPS Location'}
              </div>
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom controls overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Location button */}
        <button
          onClick={centerOnUser}
          className={`p-3 rounded-lg shadow-lg transition-colors ${
            isLocationActive 
              ? 'bg-blue-100 border-2 border-blue-500' 
              : 'bg-white hover:bg-gray-50'
          }`}
          title={isLocationActive ? "Location monitoring active" : "Center on my location"}
        >
          <Navigation className={`w-5 h-5 ${isLocationActive ? 'text-blue-700' : 'text-blue-600'}`} />
        </button>
        
        {/* Zoom controls */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={zoomIn}
            className="w-10 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <div className="w-10 h-8 bg-gray-100 flex items-center justify-center text-xs text-gray-600 border-t border-b border-gray-200">
            {Math.round(currentZoom)}
          </div>
          <button
            onClick={zoomOut}
            className="w-10 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
        </div>
        
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      
      {/* Map info */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Map Info</span>
          </div>
                      <div className="text-xs">
              <div>Businesses: {businesses.length}</div>
              <div>Deals: {deals.length}</div>
              <div className="flex items-center gap-1">
                <span>Zoom:</span>
                <span className="font-medium text-blue-600">{Math.round(currentZoom)}</span>
                {currentZoom >= 16 && <span className="text-green-600">(Street)</span>}
                {currentZoom >= 13 && currentZoom < 16 && <span className="text-blue-600">(City)</span>}
                {currentZoom < 13 && <span className="text-gray-600">(Region)</span>}
              </div>
              
              {/* Selected Location Indicator */}
              {selectedLocation && (
                <div className="mt-2 pt-2 border-t border-orange-200 bg-orange-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <div className="text-orange-700 font-medium">
                      🎯 {selectedLocation.name}
                    </div>
                  </div>
                  <div className="text-orange-600 text-xs mt-1">
                    {selectedLocation.type === 'city' ? 'City Center' : 'Neighborhood Center'}
                  </div>
                </div>
              )}
              
              {userLocation && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <div className="text-blue-600">📍 Your Location</div>
                  {locationAccuracy && (
                    <div className="text-gray-500">Accuracy: {Math.round(locationAccuracy)}m</div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
