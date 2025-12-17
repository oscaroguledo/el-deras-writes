import React, { ReactNode } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazyContentProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const LazyContent: React.FC<LazyContentProps> = ({
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '100px',
  triggerOnce = true
}) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce
  });

  return (
    <div ref={targetRef} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
};