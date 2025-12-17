import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'pulse' | 'wave' | 'shimmer';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width, 
  height, 
  className = '', 
  children,
  variant = 'pulse',
  rounded = 'md'
}) => {
  const getAnimationClass = () => {
    switch (variant) {
      case 'wave':
        return 'animate-wave';
      case 'shimmer':
        return 'animate-shimmer';
      default:
        return 'animate-pulse';
    }
  };

  const getRoundedClass = () => {
    switch (rounded) {
      case 'none':
        return '';
      case 'sm':
        return 'rounded-sm';
      case 'lg':
        return 'rounded-lg';
      case 'full':
        return 'rounded-full';
      default:
        return 'rounded-md';
    }
  };

  return (
    <div
      className={`${getAnimationClass()} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${getRoundedClass()} transition-opacity duration-300 ${width} ${height} ${className}`}
      style={{
        backgroundImage: variant === 'shimmer' 
          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
          : undefined
      }}
    >
      {children}
    </div>
  );
};

export default SkeletonLoader;
