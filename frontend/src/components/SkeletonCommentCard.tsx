import React from 'react';

interface SkeletonCommentCardProps {
  className?: string;
  isReply?: boolean;
}

const SkeletonCommentCard: React.FC<SkeletonCommentCardProps> = ({ 
  className = '', 
  isReply = false 
}) => {
  return (
    <div className={`bg-white rounded-lg p-4 animate-pulse ${isReply ? 'ml-8 border-l-2 border-gray-200' : 'shadow-sm border'} ${className}`}>
      {/* Author info skeleton */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      {/* Comment content skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      {/* Actions skeleton */}
      <div className="flex items-center space-x-4">
        <div className="h-3 bg-gray-200 rounded w-12"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
};

export default SkeletonCommentCard;