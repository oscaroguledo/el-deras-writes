import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { getFallbackImage, FALLBACK_IMAGES } from '../utils/imageUtils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallbackType?: keyof typeof FALLBACK_IMAGES;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  fallbackType = 'article',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isDark, setIsDark] = useState(false);
  
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const fallbackSrc = getFallbackImage(fallbackType, isDark);

  useEffect(() => {
    if (isIntersecting && !isLoaded && !hasError) {
      // Create a new image to preload
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(currentSrc);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        // If the original image fails and we haven't tried the fallback yet
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          // Try loading the fallback image
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            setImageSrc(fallbackSrc);
            setIsLoaded(true);
            onLoad?.();
          };
          fallbackImg.onerror = () => {
            setHasError(true);
            onError?.();
          };
          fallbackImg.src = fallbackSrc;
        } else {
          // Both original and fallback failed
          setHasError(true);
          onError?.();
        }
      };
      
      img.src = currentSrc;
    }
  }, [isIntersecting, currentSrc, fallbackSrc, isLoaded, hasError, onLoad, onError]);

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc && !hasError) {
      setIsLoaded(false);
      setHasError(false);
      setCurrentSrc(src);
      setImageSrc(placeholder);
    }
  }, [src, currentSrc, hasError, placeholder]);

  return (
    <div 
      ref={targetRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Placeholder or loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state - only show if both original and fallback failed */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ display: hasError ? 'none' : 'block' }}
        />
      )}
    </div>
  );
};