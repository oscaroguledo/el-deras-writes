import React from 'react';
import { cn } from '../../lib/utils';
interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  circle?: boolean;
}
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  height,
  width,
  circle = false
}) => {
  return <div className={cn('animate-pulse bg-gray-200', circle ? 'rounded-full' : 'rounded-md', className)} style={{
    height: height,
    width: width
  }} />;
};