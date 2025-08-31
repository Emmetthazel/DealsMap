import React, { useState, useEffect } from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingStars = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = true,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const handleStarClick = (starIndex, isHalf = false) => {
    if (readonly) return;
    
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    setCurrentRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleStarHover = (starIndex, isHalf = false) => {
    if (readonly) return;
    
    const hoverValue = starIndex + (isHalf ? 0.5 : 1);
    setHoverRating(hoverValue);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const renderStar = (index) => {
    const displayRating = hoverRating || currentRating;
    const starValue = index + 1;
    const halfStarValue = index + 0.5;
    
    let starClass = 'text-gray-300';
    let halfStarClass = 'text-gray-300';
    
    if (displayRating >= starValue) {
      starClass = 'text-yellow-400 fill-current';
    } else if (displayRating >= halfStarValue) {
      halfStarClass = 'text-yellow-400 fill-current';
    }

    return (
      <div key={index} className="relative inline-block">
        {/* Full star */}
        <button
          type="button"
          className={`${starClass} ${sizeClass} transition-colors duration-200 ${
            !readonly ? 'hover:text-yellow-400 cursor-pointer' : ''
          }`}
          onClick={() => handleStarClick(index, false)}
          onMouseEnter={() => handleStarHover(index, false)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
        >
          <Star />
        </button>
        
        {/* Half star overlay */}
        {!readonly && (
          <button
            type="button"
            className={`${halfStarClass} ${sizeClass} absolute inset-0 transition-colors duration-200 hover:text-yellow-400 cursor-pointer`}
            onClick={() => handleStarClick(index, true)}
            onMouseEnter={() => handleStarHover(index, true)}
            onMouseLeave={handleMouseLeave}
            style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
          >
            <StarHalf />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, index) => renderStar(index))}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {typeof currentRating === 'number' ? currentRating.toFixed(1) : currentRating}/5
        </span>
      )}
    </div>
  );
};

export default RatingStars;
