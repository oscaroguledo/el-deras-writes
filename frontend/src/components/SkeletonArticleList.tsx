import React from 'react';
import SkeletonArticleCard from './SkeletonArticleCard';

interface SkeletonArticleListProps {
  count?: number;
  className?: string;
}

const SkeletonArticleList: React.FC<SkeletonArticleListProps> = ({ 
  count = 6, 
  className = '' 
}) => {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonArticleCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonArticleList;