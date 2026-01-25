/**
 * Utility functions for handling images and fallbacks
 */

// Generate a placeholder image with custom dimensions and text
export const generatePlaceholderImage = (
  width: number = 400,
  height: number = 300,
  text: string = 'No Image',
  bgColor: string = '#F3F4F6',
  textColor: string = '#9CA3AF'
): string => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <g opacity="0.5">
        <path d="M${width/2 - 25} ${height/2 - 30}H${width/2 + 25}V${height/2 - 10}H${width/2 + 5}V${height/2 + 10}H${width/2 - 5}V${height/2 - 10}H${width/2 - 25}V${height/2 - 30}Z" fill="${textColor}"/>
        <path d="M${width/2 - 60} ${height/2 + 20}H${width/2 + 60}V${height/2 + 40}H${width/2 + 40}V${height/2 + 60}H${width/2 + 20}V${height/2 + 40}H${width/2}V${height/2 + 60}H${width/2 - 20}V${height/2 + 40}H${width/2 - 40}V${height/2 + 60}H${width/2 - 60}V${height/2 + 20}Z" fill="${textColor}"/>
      </g>
      <text x="${width/2}" y="${height/2 + 80}" text-anchor="middle" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500">${text}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Common fallback images for different use cases
export const FALLBACK_IMAGES = {
  article: generatePlaceholderImage(400, 300, 'Article Image'),
  avatar: generatePlaceholderImage(100, 100, 'Avatar', '#E5E7EB', '#6B7280'),
  hero: generatePlaceholderImage(800, 400, 'Hero Image'),
  thumbnail: generatePlaceholderImage(200, 150, 'Thumbnail'),
  profile: generatePlaceholderImage(150, 150, 'Profile', '#E5E7EB', '#6B7280'),
};

// Dark mode fallback images
export const DARK_FALLBACK_IMAGES = {
  article: generatePlaceholderImage(400, 300, 'Article Image', '#374151', '#9CA3AF'),
  avatar: generatePlaceholderImage(100, 100, 'Avatar', '#4B5563', '#D1D5DB'),
  hero: generatePlaceholderImage(800, 400, 'Hero Image', '#374151', '#9CA3AF'),
  thumbnail: generatePlaceholderImage(200, 150, 'Thumbnail', '#374151', '#9CA3AF'),
  profile: generatePlaceholderImage(150, 150, 'Profile', '#4B5563', '#D1D5DB'),
};

// Get appropriate fallback based on theme
export const getFallbackImage = (type: keyof typeof FALLBACK_IMAGES, isDark: boolean = false) => {
  return isDark ? DARK_FALLBACK_IMAGES[type] : FALLBACK_IMAGES[type];
};

// Validate if a URL is a valid image URL
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  
  // Check for data URLs
  const dataUrl = /^data:image\//i;
  
  // Check for valid HTTP/HTTPS URLs
  const httpUrl = /^https?:\/\/.+/i;
  
  return imageExtensions.test(url) || dataUrl.test(url) || httpUrl.test(url);
};

// Get a safe image source with fallback
export const getSafeImageSrc = (
  src: string | null | undefined, 
  fallbackType: keyof typeof FALLBACK_IMAGES = 'article',
  isDark: boolean = false
): string => {
  if (!src || !isValidImageUrl(src)) {
    return getFallbackImage(fallbackType, isDark);
  }
  return src;
};