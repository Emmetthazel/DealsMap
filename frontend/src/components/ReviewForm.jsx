import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RatingStars from './RatingStars';

const ReviewForm = ({ 
  businessId, 
  dealId, 
  onSubmit, 
  onCancel, 
  existingReview = null,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    business: businessId || null,
    deal: dealId || null
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating,
        comment: existingReview.comment,
        business: existingReview.business || businessId,
        deal: existingReview.deal || dealId
      });
    }
  }, [existingReview, businessId, dealId]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a comment';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long';
    } else if (formData.comment.trim().length > 1000) {
      newErrors.comment = 'Comment must be less than 1000 characters';
    }

    if (!formData.business && !formData.deal) {
      newErrors.general = 'Please select either a business or deal to review';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Review submitted successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          rating: 0,
          comment: '',
          business: businessId || null,
          deal: dealId || null
        });
        setIsSubmitted(false);
        if (onCancel) onCancel();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRatingChange = (rating) => {
    handleInputChange('rating', rating);
  };

  const handleCommentChange = (e) => {
    const comment = e.target.value;
    handleInputChange('comment', comment);
    
    // Real-time character count validation
    if (comment.length > 1000) {
      setErrors(prev => ({ ...prev, comment: 'Comment must be less than 1000 characters' }));
    } else if (comment.length < 10 && comment.length > 0) {
      setErrors(prev => ({ ...prev, comment: 'Comment must be at least 10 characters long' }));
    } else if (comment.length >= 10) {
      setErrors(prev => ({ ...prev, comment: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Review Submitted!</h3>
        <p className="text-green-600">Thank you for your review. It will be visible after moderation.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Rating *
          </label>
          <RatingStars
            rating={formData.rating}
            onRatingChange={handleRatingChange}
            size="lg"
            showValue={false}
          />
          {errors.rating && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.rating}
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            rows={4}
            value={formData.comment}
            onChange={handleCommentChange}
            placeholder="Share your experience with this business or deal..."
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.comment ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {errors.comment && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.comment}
                </div>
              )}
            </div>
            <div className={`text-xs ${
              formData.comment.length > 900 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {formData.comment.length}/1000
            </div>
          </div>
        </div>

        {/* General Errors */}
        {errors.general && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{errors.general}</span>
          </div>
        )}

        {/* Review Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Review Guidelines:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Be honest and constructive in your feedback</li>
            <li>• Avoid personal attacks or inappropriate language</li>
            <li>• Focus on your actual experience</li>
            <li>• Reviews are moderated and may take time to appear</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || formData.rating === 0 || !formData.comment.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
              isSubmitting || formData.rating === 0 || !formData.comment.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {existingReview ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
