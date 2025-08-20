import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DealForm = ({ deal = null, onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    original_price: '',
    deal_price: '',
    start_date: '',
    end_date: '',
    max_uses: 100,
    conditions: '',
    is_active: true,
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');

  // Load businesses for the current user
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const response = await fetch('/api/businesses/my-businesses/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data.results || data);
          if (data.results && data.results.length > 0) {
            setSelectedBusiness(data.results[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading businesses:', error);
      }
    };

    if (deal) {
      // Edit mode - populate form with existing deal data
      setFormData({
        title: deal.title || '',
        description: deal.description || '',
        original_price: deal.original_price || '',
        deal_price: deal.deal_price || '',
        start_date: deal.start_date ? new Date(deal.start_date).toISOString().slice(0, 16) : '',
        end_date: deal.end_date ? new Date(deal.end_date).toISOString().slice(0, 16) : '',
        max_uses: deal.max_uses || 100,
        conditions: deal.conditions || '',
        is_active: deal.is_active !== undefined ? deal.is_active : true,
        image: null
      });
      setSelectedBusiness(deal.business);
      if (deal.image) {
        setImagePreview(deal.image);
      }
    } else {
      // Create mode - load user's businesses
      loadBusinesses();
    }
  }, [deal]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image file size must be under 5MB' }));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'Only JPEG, PNG and WebP images are allowed' }));
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      newErrors.original_price = 'Valid original price is required';
    }

    if (!formData.deal_price || parseFloat(formData.deal_price) <= 0) {
      newErrors.deal_price = 'Valid deal price is required';
    }

    if (formData.original_price && formData.deal_price) {
      if (parseFloat(formData.deal_price) >= parseFloat(formData.original_price)) {
        newErrors.deal_price = 'Deal price must be less than original price';
      }
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (start >= end) {
        newErrors.end_date = 'End date must be after start date';
      }
      
      // Check if deal duration is more than 4 weeks
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 28) {
        newErrors.end_date = 'Deal duration cannot exceed 4 weeks';
      }
    }

    if (!deal && !selectedBusiness) {
      newErrors.business = 'Business selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add business ID for new deals
      if (!deal && selectedBusiness) {
        formDataToSend.append('business', selectedBusiness);
      }

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          formDataToSend.append('image', formData[key]);
        } else if (key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const url = deal ? `/api/deals/${deal.id}/` : '/api/deals/';
      const method = deal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        if (onSubmit) {
          onSubmit(result);
        } else {
          navigate('/dashboard/deals');
        }
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      console.error('Error submitting deal:', error);
      setErrors({ general: 'An error occurred while saving the deal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard/deals');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with gradient background like mockup */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg mb-8 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                <i className="fas fa-percent mr-3"></i>
                {deal ? 'Modifier le Deal' : 'Créer un Nouveau Deal'}
              </h1>
              <p className="mt-2 text-blue-100">
                {deal ? 'Mettez à jour les informations de votre deal' : 'Créez une nouvelle offre promotionnelle pour votre établissement'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border-2 border-white rounded-full text-sm font-medium text-white hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">
              {deal ? 'Modifier le Deal' : 'Créer un Nouveau Deal'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {deal ? 'Mettez à jour les informations de votre deal' : 'Créez une nouvelle offre promotionnelle pour votre établissement'}
            </p>
          </div>
          
          <div className="p-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Selection (only for new deals) */}
              {!deal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business *
                  </label>
                  <select
                    name="business"
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.business ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a business</option>
                    {businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                  {errors.business && (
                    <p className="mt-1 text-sm text-red-600">{errors.business}</p>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter deal title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the deal details"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="original_price"
                      value={formData.original_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.original_price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.original_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.original_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="deal_price"
                      value={formData.deal_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.deal_price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.deal_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.deal_price}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  name="max_uses"
                  value={formData.max_uses}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.max_uses ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_uses && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_uses}</p>
                )}
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms and Conditions
                </label>
                <textarea
                  name="conditions"
                  value={formData.conditions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special terms or conditions"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.image && (
                    <p className="text-sm text-red-600">{errors.image}</p>
                  )}
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active Deal
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (deal ? 'Update Deal' : 'Create Deal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealForm;
