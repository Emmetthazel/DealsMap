import React, { useState, useEffect, useRef } from 'react';
import BusinessService from '../services/BusinessService.js';
import { getCurrentLocation, validateCoordinates } from '../services/GeoService.js';
import { fetchCategories } from '../services/categoryService.js';

const BusinessForm = ({ business = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    opening_hours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' }
    },
    category: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);

  // Load business data if editing
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        address: business.address || '',
        city: business.city || '',
        postal_code: business.postal_code || '',
        latitude: business.latitude || '',
        longitude: business.longitude || '',
        opening_hours: business.opening_hours || {
          monday: { open: '', close: '' },
          tuesday: { open: '', close: '' },
          wednesday: { open: '', close: '' },
          thursday: { open: '', close: '' },
          friday: { open: '', close: '' },
          saturday: { open: '', close: '' },
          sunday: { open: '', close: '' }
        },
        category: business.category || ''
      });
      
      if (business.image) {
        setImagePreview(business.image);
      }
    }
  }, [business]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Attempting to load categories...');
      // Request all categories for business creation
      const categoriesData = await fetchCategories('?all=true');
      console.log('Loaded categories:', categoriesData);
      console.log('Categories type:', typeof categoriesData);
      console.log('Categories length:', categoriesData?.length);
      if (categoriesData && categoriesData.length > 0) {
        console.log('First category sample:', categoriesData[0]);
      }
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      console.error('Error details:', error.message);
      // Fallback to empty array if categories fail to load
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    setError('');
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser. Please enter coordinates manually.');
      }

      // Check if we're on HTTPS or localhost (geolocation requirement)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn('Geolocation may not work on non-HTTPS connections');
      }

      const location = await getCurrentLocation();
      
      if (location && location.lat && location.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: location.lat.toString(),
          longitude: location.lng.toString()
        }));
        setSuccess(`Location obtained successfully! (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})`);
      } else {
        throw new Error('Invalid location data received');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      
      // Provide specific guidance based on error type
      let userMessage = 'Failed to get location. ';
      
      if (error.message.includes('denied')) {
        userMessage += 'Please allow location access in your browser settings and try again.';
      } else if (error.message.includes('unavailable')) {
        userMessage += 'Location service is unavailable. Please check your device settings.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'Location request timed out. Please try again.';
      } else if (error.message.includes('not supported')) {
        userMessage += 'Your browser does not support geolocation. Please enter coordinates manually.';
      } else {
        userMessage += error.message || 'Please enter coordinates manually.';
      }
      
      setError(userMessage);
      
      // Show helpful instructions
      if (error.message.includes('denied')) {
        setError(userMessage + ' To enable location access: 1) Click the location icon in your browser address bar, 2) Select "Allow", 3) Refresh the page and try again.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
    
    if (!formData.name.trim()) {
      setError('Business name is required.');
      return false;
    }
    
    if (!formData.address.trim()) {
      setError('Address is required.');
      return false;
    }
    
    if (!formData.city.trim()) {
      setError('City is required.');
      return false;
    }
    
    console.log('Checking coordinates - latitude:', formData.latitude, 'longitude:', formData.longitude);
    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required.');
      return false;
    }
    
    // Check if coordinates are valid numbers
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordinates must be valid numbers.');
      return false;
    }
    
    if (!validateCoordinates(lat, lng)) {
      setError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
      return false;
    }
    
    console.log('Form validation passed');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission - formData:', formData);
    console.log('Latitude value:', formData.latitude, 'Type:', typeof formData.latitude);
    console.log('Longitude value:', formData.longitude, 'Type:', typeof formData.longitude);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Clean up form data - keep category even if empty
      const cleanedFormData = { ...formData };
      console.log('Original formData:', formData);
      console.log('Cleaned formData:', cleanedFormData);
      
      // Ensure coordinates are properly converted to numbers
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates. Please enter valid numbers for latitude and longitude.');
      }
      
      const businessData = {
        ...cleanedFormData,
        latitude: lat,
        longitude: lng
      };
      
      console.log('Final businessData:', businessData);
      console.log('Coordinates in businessData:', { lat: businessData.latitude, lng: businessData.longitude });
      
      let result;
      if (business) {
        // Update existing business
        result = await BusinessService.updateBusiness(business.id, businessData, imageFile);
        setSuccess('Business updated successfully!');
      } else {
        // Create new business (without image for now - JSON only)
        result = await BusinessService.createBusiness(businessData);
        setSuccess('Business created successfully!');
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {business ? 'Edit Business' : 'Create New Business'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter business name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category (optional)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter street address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter postal code"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40.7128"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., -74.0060"
                required
              />
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGettingLocation ? 'Getting Location...' : 'Get Current Location'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Opening Hours</h3>
          
          <div className="space-y-3">
            {daysOfWeek.map(day => (
              <div key={day.key} className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium text-gray-700">{day.label}</div>
                <div>
                  <input
                    type="time"
                    value={formData.opening_hours[day.key].open}
                    onChange={(e) => handleOpeningHoursChange(day.key, 'open', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.opening_hours[day.key].close}
                    onChange={(e) => handleOpeningHoursChange(day.key, 'close', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Business Image</h3>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Business preview"
                  className="w-48 h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t pt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (business ? 'Update Business' : 'Create Business')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessForm;
