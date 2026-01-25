import React, { useState, useEffect } from 'react';
import { getFallbackImage, FALLBACK_IMAGES } from '../utils/imageUtils';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: keyof typeof FALLBACK_IMAGES;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * SafeImage component that provides fallback images without lazy loading
 * Use this for images that need to load immediately (like avatars in headers)
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'article',
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  // Reset when src changes
  useEffect(() => {
    if (src !== currentSrc && !hasError) {
      setCurrentSrc(src);
      setHasError(false);
    }
  }, [src, currentSrc, hasError]);

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 text-center">
          <svg className="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs">No image</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};