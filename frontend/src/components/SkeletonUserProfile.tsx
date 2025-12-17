import React from 'react';

interface SkeletonUserProfileProps {
  className?: string;
  showBio?: boolean;
  showStats?: boolean;
}

const SkeletonUserProfile: React.FC<SkeletonUserProfileProps> = ({ 
  className = '', 
  showBio = true,
  showStats = false
}) => {
  return (
    <div className={`bg-white rounded-lg p-6 animate-pulse ${className}`}>
      {/* Avatar and basic info */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      
      {/* Bio section */}
      {showBio && (
        <div className="mb-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      )}
      
      {/* Stats section */}
      {showStats && (
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="h-6 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-14"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkeletonUserProfile;