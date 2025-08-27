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

const MapContainer = ({ 
  businesses = [], 
  deals = [], 
  onMarkerClick, 
  center = [2.3522, 48.8566], // Paris default
  zoom = 12 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);

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

    return features;
  }, [businesses, deals]);

  // Create marker styles
  const createMarkerStyle = useCallback((feature) => {
    const type = feature.get('type');
    const category = feature.get('category');
    const discount = feature.get('discount');
    
    let color = '#3B82F6'; // Default blue
    let icon = '🏪'; // Default business icon
    
    // Color coding by category
    if (category === 'Restaurant') {
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
        scale: 1,
        anchor: [0.5, 1]
      }),
      text: new Text({
        text: feature.get('name'),
        font: '12px Arial',
        fill: new Fill({ color: '#1F2937' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
        offsetY: -40
      })
    });
  }, []);

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
          source: new OSM()
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
        rotate: false
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

    // Update zoom state
    map.getView().on('change:resolution', () => {
      setCurrentZoom(map.getView().getZoom());
    });

    // Cleanup
    return () => {
      if (map) {
        map.setTarget(undefined);
      }
    };
  }, [center, zoom, createMarkerFeatures, createMarkerStyle, onMarkerClick]);

  // Update markers when data changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const features = createMarkerFeatures();
      const vectorSource = mapInstanceRef.current.getLayers().getArray()[1].getSource().getSource();
      vectorSource.clear();
      vectorSource.addFeatures(features);
    }
  }, [businesses, deals, createMarkerFeatures]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
        
        if (mapInstanceRef.current) {
          const view = mapInstanceRef.current.getView();
          view.animate({
            center: fromLonLat([longitude, latitude]),
            zoom: 15,
            duration: 1000
          });
        }
        
        toast.success('Location updated!');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Could not get your location');
      }
    );
  }, []);

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
    if (mapInstanceRef.current) {
      const fullscreenControl = mapInstanceRef.current.getControls().getArray()
        .find(control => control instanceof FullScreen);
      
      if (fullscreenControl) {
        fullscreenControl.handleClick_();
        setIsFullscreen(!isFullscreen);
      }
    }
  }, [isFullscreen]);

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
      
      {/* Custom controls overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Location button */}
        <button
          onClick={centerOnUser}
          className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Center on my location"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>
        
        {/* Zoom controls */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={zoomIn}
            className="block w-10 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <div className="w-10 h-8 bg-gray-100 flex items-center justify-center text-xs text-gray-600 border-t border-b border-gray-200">
            {Math.round(currentZoom)}
          </div>
          <button
            onClick={zoomOut}
            className="block w-10 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
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
            <div>Zoom: {Math.round(currentZoom)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
