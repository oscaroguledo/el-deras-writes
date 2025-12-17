import { useState, useEffect, useCallback } from 'react';

interface UseProgressiveLoadingOptions<T> {
  initialData?: T[];
  batchSize?: number;
  loadDelay?: number;
}

export const useProgressiveLoading = <T>(
  data: T[],
  options: UseProgressiveLoadingOptions<T> = {}
) => {
  const {
    initialData = [],
    batchSize = 6,
    loadDelay = 100
  } = options;

  const [visibleItems, setVisibleItems] = useState<T[]>(initialData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNextBatch = useCallback(() => {
    if (currentIndex >= data.length || isLoading) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const nextIndex = Math.min(currentIndex + batchSize, data.length);
      const newItems = data.slice(currentIndex, nextIndex);
      
      setVisibleItems(prev => [...prev, ...newItems]);
      setCurrentIndex(nextIndex);
      setIsLoading(false);
    }, loadDelay);
  }, [data, currentIndex, batchSize, loadDelay, isLoading]);

  const hasMore = currentIndex < data.length;

  // Reset when data changes
  useEffect(() => {
    setVisibleItems(data.slice(0, Math.min(batchSize, data.length)));
    setCurrentIndex(Math.min(batchSize, data.length));
  }, [data, batchSize]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadNextBatch,
    progress: data.length > 0 ? (currentIndex / data.length) * 100 : 0
  };
};