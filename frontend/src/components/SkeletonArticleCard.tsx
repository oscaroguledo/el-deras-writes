import React from 'react';

interface SkeletonArticleCardProps {
  className?: string;
}

const SkeletonArticleCard: React.FC<SkeletonArticleCardProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden animate-pulse ${className}`}>
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-300"></div>
      
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-300 rounded mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        
        {/* Excerpt skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        {/* Meta info skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonArticleCard;