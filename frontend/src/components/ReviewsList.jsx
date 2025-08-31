import React, { useState } from 'react';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MoreVertical,
  User,
  Calendar,
  Star
} from 'lucide-react';
import RatingStars from './RatingStars';
import ReviewForm from './ReviewForm';
import { toast } from 'react-hot-toast';
import OwnerResponseForm from './OwnerResponseForm';

const ReviewsList = ({ 
  reviews = [], 
  businessId, 
  dealId, 
  onAddReview,
  onEditReview,
  onDeleteReview,
  currentUserId,
  showAddButton = true,
  className = ''
}) => {
  const [expandedReview, setExpandedReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleLike = (reviewId) => {
    // TODO: Implement like functionality
    toast.success('Like functionality coming soon!');
  };

  const handleDislike = (reviewId) => {
    // TODO: Implement dislike functionality
    toast.success('Dislike functionality coming soon!');
  };

  const handleReport = (reviewId) => {
    // TODO: Implement report functionality
    toast.success('Report submitted. Thank you for helping keep our community safe.');
  };

  const handleEdit = (review) => {
    setExpandedReview(review.id);
    setShowReviewForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await onDeleteReview(reviewId);
        toast.success('Review deleted successfully');
      } catch (error) {
        toast.error('Failed to delete review');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getReviewStats = () => {
    if (reviews.length === 0) return null;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    return {
      total: reviews.length,
      average: averageRating,
      distribution: ratingDistribution
    };
  };

  const stats = getReviewStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Reviews ({reviews.length})
          </h3>
          {stats && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <RatingStars rating={stats.average} readonly size="sm" />
                <span className="text-sm text-gray-600">
                  {stats.average.toFixed(1)} out of 5
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Based on {stats.total} reviews
              </span>
            </div>
          )}
        </div>
        
        {showAddButton && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Breakdown</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.distribution[rating];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-gray-600">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="border-t border-gray-200 pt-6">
          <ReviewForm
            businessId={businessId}
            dealId={dealId}
            onSubmit={onAddReview}
            onCancel={() => setShowReviewForm(false)}
            existingReview={expandedReview ? reviews.find(r => r.id === expandedReview) : null}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {review.user?.profile_picture ? (
                      <img 
                        src={review.user.profile_picture} 
                        alt={review.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.user?.username || 'Anonymous User'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>
                
                {/* Review Actions Menu */}
                <div className="relative">
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {/* TODO: Add dropdown menu for actions */}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-3">
                <RatingStars rating={review.rating} readonly size="sm" />
              </div>

              {/* Review Content */}
              <div className="text-gray-700 mb-4">
                {review.comment}
              </div>

              {/* Owner Response */}
              {review.owner_response && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-800 text-sm mb-1">
                        Business Owner Response
                      </div>
                      <div className="text-blue-700 text-sm">
                        {review.owner_response}
                      </div>
                      <div className="text-blue-500 text-xs mt-1">
                        {new Date(review.owner_response_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Response Form */}
              <OwnerResponseForm
                review={review}
                onResponseSubmitted={() => {
                  // Refresh the reviews list to show the new response
                  if (onAddReview) {
                    onAddReview();
                  }
                }}
                onCancel={() => {
                  // Handle cancel if needed
                }}
              />

              {/* Review Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(review.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Helpful</span>
                  </button>
                  
                  <button
                    onClick={() => handleDislike(review.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">Not helpful</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentUserId === review.user?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(review)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleReport(review.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Flag className="w-3 h-3" />
                    Report
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsList;
