import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  children?: React.ReactNode;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height, className, children }) => {
  return (
    <div
      className={`animate-pulse bg-gray-300 rounded-md ${width} ${height} ${className}`}
    >
      {children}
    </div>
  );
};

export default SkeletonLoader;
