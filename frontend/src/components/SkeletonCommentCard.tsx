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
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 animate-pulse ${isReply ? 'ml-4 sm:ml-6 border-l border-gray-200 dark:border-gray-700' : 'shadow-sm border border-gray-200 dark:border-gray-700'} ${className}`}>
      {/* Author info skeleton */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="flex-1">
          <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 sm:w-24 mb-1"></div>
          <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16"></div>
        </div>
      </div>
      
      {/* Comment content skeleton */}
      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
      
      {/* Actions skeleton */}
      <div className="flex items-center justify-end">
        <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-10 sm:w-12"></div>
      </div>
    </div>
  );
};

export default SkeletonCommentCard;