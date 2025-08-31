import { apiService } from './apiService';

class ReviewService {

  // Get all reviews with optional filters
  async getReviews(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.business_id) params.append('business_id', filters.business_id);
      if (filters.deal_id) params.append('deal_id', filters.deal_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.min_rating) params.append('min_rating', filters.min_rating);
      if (filters.max_rating) params.append('max_rating', filters.max_rating);
      
      const response = await apiService.get(`/reviews/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }

  // Get reviews for a specific business
  async getBusinessReviews(businessId) {
    try {
      const response = await apiService.get(`/reviews/business_reviews/?business_id=${businessId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching business reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch business reviews');
    }
  }

  // Get reviews for a specific deal
  async getDealReviews(dealId) {
    try {
      const response = await apiService.get(`/reviews/deal_reviews/?deal_id=${dealId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch deal reviews');
    }
  }

  // Get current user's reviews
  async getMyReviews() {
    try {
      const response = await apiService.get('/reviews/my_reviews/');
      return response.data;
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch your reviews');
    }
  }

  // Create a new review
  async createReview(reviewData) {
    try {
      console.log('📤 ReviewService: Sending review data:', reviewData);
      console.log('📤 ReviewService: API endpoint:', '/reviews/');
      
      const response = await apiService.post('/reviews/', reviewData);
      console.log('✅ ReviewService: Review created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ReviewService: Error creating review:', error);
      console.error('❌ ReviewService: Error response:', error.response?.data);
      console.error('❌ ReviewService: Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          'Failed to create review';
      throw new Error(errorMessage);
    }
  }

  // Update an existing review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await apiService.put(`/reviews/${reviewId}/`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          'Failed to update review';
      throw new Error(errorMessage);
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await apiService.delete(`/reviews/${reviewId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  }

  // Get review statistics
  async getReviewStats(businessId = null, dealId = null) {
    try {
      const params = new URLSearchParams();
      if (businessId) params.append('business_id', businessId);
      if (dealId) params.append('deal_id', dealId);
      
      const response = await apiService.get(`/reviews/stats/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch review statistics');
    }
  }

  // Get reviews pending moderation (admin only)
  async getPendingReviews() {
    try {
      const response = await apiService.get('/reviews/pending_moderation/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending reviews');
    }
  }

  // Approve a review (admin only)
  async approveReview(reviewId) {
    try {
      const response = await apiService.post(`/reviews/${reviewId}/approve/`);
      return response.data;
    } catch (error) {
      console.error('Error approving review:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve review');
    }
  }

  // Reject a review (admin only)
  async rejectReview(reviewId, reason = '') {
    try {
      const response = await apiService.post(`/reviews/${reviewId}/reject/`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting review:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject review');
    }
  }

  // Check if user has already reviewed a business/deal
  async checkExistingReview(businessId = null, dealId = null) {
    try {
      const params = new URLSearchParams();
      if (businessId) params.append('business_id', businessId);
      if (dealId) params.append('deal_id', dealId);
      
      const response = await apiService.get(`/reviews/?${params.toString()}`);
      const reviews = response.data.results || response.data;
      
      // Check if current user has a review
      const currentUserId = this.getCurrentUserId();
      if (currentUserId) {
        return reviews.find(review => review.user?.id === currentUserId);
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing review:', error);
      return null;
    }
  }

  // Get current user ID from token
  getCurrentUserId() {
    try {
      const token = apiService.getAccessToken();
      if (!token) return null;
      
      // Decode JWT token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Validate review data before submission
  validateReviewData(reviewData) {
    const errors = [];

    if (!reviewData.rating || reviewData.rating < 0.5 || reviewData.rating > 5) {
      errors.push('Rating must be between 0.5 and 5.0');
    }

    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      errors.push('Comment must be at least 10 characters long');
    }

    if (reviewData.comment && reviewData.comment.trim().length > 1000) {
      errors.push('Comment must be less than 1000 characters');
    }

    if (!reviewData.business && !reviewData.deal) {
      errors.push('Please select either a business or deal to review');
    }

    if (reviewData.business && reviewData.deal) {
      errors.push('Cannot review both business and deal simultaneously');
    }

    return errors;
  }
}

export default new ReviewService();
