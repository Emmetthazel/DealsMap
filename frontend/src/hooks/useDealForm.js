import { useState, useRef, useEffect } from 'react';
import DealService from '../services/DealService';
import { calculateDiscount, validateDates } from '../utils/dealFormUtils';

export default function useDealForm(initialData = null) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    original_price: initialData?.original_price || '',
    deal_price: initialData?.deal_price || '',
    discount_percentage: initialData?.discount_percentage || 0,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    max_uses: initialData?.max_uses || '',
    current_uses: initialData?.current_uses || 0,
    business: initialData?.business || '',
    category: initialData?.category || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    ...initialData
  });
  const [images, setImages] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState({ businesses: true, categories: true });
  const fileInputRef = useRef(null);

  // Helper for API fetch (for businesses/categories)
  const API_BASE_URL = 'http://localhost:8000/api';
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
    if (!response.ok) throw new Error('Erreur API');
    return await response.json();
  };

  // Load categories/businesses
  const loadCategories = async () => {
    setLoadingData(prev => ({ ...prev, categories: true }));
    try {
      const data = await apiRequest('/categories/');
      setCategories(data.results || data);
    } catch {
      setErrors(prev => ({ ...prev, categories: 'Erreur lors du chargement des catégories' }));
    } finally {
      setLoadingData(prev => ({ ...prev, categories: false }));
    }
  };
  const loadBusinesses = async () => {
    setLoadingData(prev => ({ ...prev, businesses: true }));
    try {
      const data = await apiRequest('/businesses/');
      setBusinesses(data.results || data);
    } catch {
      setErrors(prev => ({ ...prev, businesses: 'Erreur lors du chargement des établissements' }));
    } finally {
      setLoadingData(prev => ({ ...prev, businesses: false }));
    }
  };
  const reloadData = async () => {
    await Promise.all([loadCategories(), loadBusinesses()]);
  };

  useEffect(() => {
    loadCategories();
    loadBusinesses();
    if (initialData?.images) {
      setImages(initialData.images.map((img, index) => ({
        id: `existing-${index}`,
        url: img.image || img,
        name: `Image ${index + 1}`,
        isExisting: true
      })));
    }
    // eslint-disable-next-line
  }, [initialData]);

  // Discount calculation


  // Price change handler
  const handlePriceChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    if (field === 'original_price' || field === 'deal_price') {
      const discount = calculateDiscount(
        field === 'original_price' ? value : formData.original_price,
        field === 'deal_price' ? value : formData.deal_price
      );
      newFormData.discount_percentage = discount;
    }
    setFormData(newFormData);
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  // Image upload
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024;
    const maxImages = 5;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (images.length + files.length > maxImages) {
      setErrors({...errors, images: `Maximum ${maxImages} images autorisées`});
      return;
    }
    files.forEach(file => {
      if (file.size > maxSize) {
        setErrors({...errors, images: 'Les images ne peuvent pas dépasser 5MB chacune'});
        return;
      }
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setErrors({...errors, images: 'Formats acceptés: JPG, PNG, WebP uniquement'});
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          name: file.name,
          isExisting: false
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (errors.images) setErrors({...errors, images: null});
  };
  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    if (errors.images) setErrors({...errors, images: null});
  };

  // Validation (utilise DealService)
  const validateForm = () => {
    const validationErrors = DealService.validateDeal(formData);
    // Validation des dates avancée (utilitaire)
    const dateError = validateDates(formData.start_date, formData.end_date);
    if (dateError) validationErrors.dates = dateError;
    if (images.length === 0) validationErrors.images = 'Au moins une image est requise';
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (onSubmit) => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const imageFile = images[0]?.file || null;
      if (initialData && initialData.id) {
        await DealService.updateDeal(initialData.id, formData, imageFile);
      } else {
        await DealService.createDeal(formData, imageFile);
      }
      if (onSubmit) onSubmit();
    } catch (error) {
      setErrors({ submit: error.message || "Erreur lors de l'enregistrement" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    images,
    setImages,
    businesses,
    categories,
    errors,
    setErrors,
    isSubmitting,
    loadingData,
    fileInputRef,
    handlePriceChange,
    handleImageUpload,
    removeImage,
    reloadData,
    handleSubmit,
  };
}
