class DealService {
  constructor() {
    this.baseURL = '/api/deals';
  }

  getStorage() {
    const storageType = localStorage.getItem('auth_storage_type');
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  getHeaders() {
    const storage = this.getStorage();
    const token = storage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  getFormDataHeaders() {
    const storage = this.getStorage();
    const token = storage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type for FormData, let browser set it with boundary
    };
  }

  // Get all deals with optional filtering
  async getDeals(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = queryParams.toString() ? `${this.baseURL}/?${queryParams.toString()}` : this.baseURL;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get deals near a specific location
  async getNearbyDeals(latitude, longitude, radius = 10, category = null) {
    try {
      const queryParams = new URLSearchParams({
        lat: latitude,
        lng: longitude,
        radius: radius
      });

      if (category) {
        queryParams.append('category', category);
      }

      const response = await fetch(`${this.baseURL}/nearby/?${queryParams.toString()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get deals for businesses owned by the current user
  async getMyDeals(status = null) {
    try {
      const queryParams = new URLSearchParams();
      if (status) {
        queryParams.append('status', status);
      }

      const url = queryParams.toString() ? `${this.baseURL}/my-deals/?${queryParams.toString()}` : `${this.baseURL}/my-deals/`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Search deals with advanced filters
  async searchDeals(searchParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add search parameters
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== null && searchParams[key] !== undefined && searchParams[key] !== '') {
          queryParams.append(key, searchParams[key]);
        }
      });

      const url = queryParams.toString() ? `${this.baseURL}/search/?${queryParams.toString()}` : `${this.baseURL}/search/`;
      
      console.log('DealService.searchDeals - URL:', url);
      console.log('DealService.searchDeals - Query params:', queryParams.toString());
      console.log('DealService.searchDeals - Search params received:', searchParams);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Public search deals (no authentication required)
  async searchDealsPublic(searchParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add search parameters
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== null && searchParams[key] !== undefined && searchParams[key] !== '') {
          queryParams.append(key, searchParams[key]);
        }
      });

      const url = queryParams.toString() ? `${this.baseURL}/search/?${queryParams.toString()}` : `${this.baseURL}/search/`;
      
      console.log('DealService.searchDealsPublic - URL:', url);
      console.log('DealService.searchDealsPublic - Query params:', queryParams.toString());
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get a single deal by ID
  async getDeal(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Create a new deal
  async createDeal(dealData) {
    try {
      // Validate required fields
      const requiredFields = ['business', 'title', 'description', 'original_price', 'deal_price', 'start_date', 'end_date'];
      const missingFields = requiredFields.filter(field => !dealData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate business logic
      if (parseFloat(dealData.deal_price) >= parseFloat(dealData.original_price)) {
        throw new Error('Deal price must be less than original price');
      }

      const startDate = new Date(dealData.start_date);
      const endDate = new Date(dealData.end_date);
      
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Check if duration is more than 4 weeks
      const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (duration > 28) {
        throw new Error('Deal duration cannot exceed 4 weeks');
      }

      // Prepare data for submission
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(dealData).forEach(key => {
        if (dealData[key] !== null && dealData[key] !== undefined && dealData[key] !== '') {
          submitData.append(key, dealData[key]);
        }
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Update an existing deal
  async updateDeal(id, dealData) {
    try {
      // Validate business logic for updates
      if (dealData.deal_price && dealData.original_price) {
        if (parseFloat(dealData.deal_price) >= parseFloat(dealData.original_price)) {
          throw new Error('Deal price must be less than original price');
        }
      }

      if (dealData.start_date && dealData.end_date) {
        const startDate = new Date(dealData.start_date);
        const endDate = new Date(dealData.end_date);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }

        // Check if duration is more than 4 weeks
        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (duration > 28) {
          throw new Error('Deal duration cannot exceed 4 weeks');
        }
      }

      // Prepare data for submission
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(dealData).forEach(key => {
        if (dealData[key] !== null && dealData[key] !== undefined && dealData[key] !== '') {
          submitData.append(key, dealData[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/${id}/`, {
        method: 'PUT',
        headers: this.getFormDataHeaders(),
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get a single deal by ID
  async getDealById(id) {
    try {
      console.log('DealService.getDealById called with ID:', id);
      console.log('Making request to:', `${this.baseURL}/${id}/`);
      const response = await fetch(`${this.baseURL}/${id}/`, {
        headers: this.getHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('DealService.getDealById error:', error);
      throw error;
    }
  }

  // Delete a deal (soft delete - sets is_active to false)
  async deleteDeal(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get deal categories
  async getDealCategories() {
    try {
      const response = await fetch(`${this.baseURL}/categories/`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Validate deal data before submission
  validateDealData(dealData) {
    const errors = {};

    // Required fields validation
    if (!dealData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!dealData.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!dealData.original_price || parseFloat(dealData.original_price) <= 0) {
      errors.original_price = 'Original price must be greater than 0';
    }

    if (!dealData.deal_price || parseFloat(dealData.deal_price) <= 0) {
      errors.deal_price = 'Deal price must be greater than 0';
    }

    if (dealData.original_price && dealData.deal_price) {
      if (parseFloat(dealData.deal_price) >= parseFloat(dealData.original_price)) {
        errors.deal_price = 'Deal price must be less than original price';
      }
    }

    if (!dealData.start_date) {
      errors.start_date = 'Start date is required';
    }

    if (!dealData.end_date) {
      errors.end_date = 'End date is required';
    }

    if (dealData.start_date && dealData.end_date) {
      const startDate = new Date(dealData.start_date);
      const endDate = new Date(dealData.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }

      // Check if duration is more than 4 weeks
      const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (duration > 28) {
        errors.end_date = 'Deal duration cannot exceed 4 weeks';
      }
    }

    if (!dealData.max_uses || dealData.max_uses <= 0) {
      errors.max_uses = 'Maximum uses must be greater than 0';
    }

    if (!dealData.business) {
      errors.business = 'Business selection is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Calculate discount percentage
  calculateDiscountPercentage(originalPrice, dealPrice) {
    if (!originalPrice || !dealPrice || parseFloat(dealPrice) >= parseFloat(originalPrice)) {
      return 0;
    }
    
    const discount = ((parseFloat(originalPrice) - parseFloat(dealPrice)) / parseFloat(originalPrice)) * 100;
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  // Format price for display
  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get deal status
  getDealStatus(deal) {
    const now = new Date();
    const startDate = new Date(deal.start_date);
    const endDate = new Date(deal.end_date);

    if (!deal.is_active) {
      return 'inactive';
    }

    if (now < startDate) {
      return 'upcoming';
    }

    if (now > endDate) {
      return 'expired';
    }

    if (deal.current_uses >= deal.max_uses) {
      return 'fully_used';
    }

    return 'active';
  }

  // Get status color for UI
  getStatusColor(status) {
    const colors = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      fully_used: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.inactive;
  }
}

export default new DealService();
