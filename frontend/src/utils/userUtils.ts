/**
 * Utility functions for user-related operations
 */

/**
 * Truncate text with ellipsis based on character count
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get responsive truncation length based on screen size
 */
export function getResponsiveTruncateLength(): number {
  if (typeof window === 'undefined') return 200; // SSR fallback
  
  const width = window.innerWidth;
  if (width < 640) return 120; // Mobile
  if (width < 768) return 160; // Small tablet
  if (width < 1024) return 200; // Tablet
  return 250; // Desktop
}

/**
 * Generate user initials from first name and last name
 * Falls back to username if names are not available
 */
export function getUserInitials(user: {
  first_name?: string;
  last_name?: string;
  username?: string;
}): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }
  
  if (user.first_name) {
    return user.first_name.charAt(0).toUpperCase();
  }
  
  if (user.last_name) {
    return user.last_name.charAt(0).toUpperCase();
  }
  
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  return 'U'; // Default fallback
}

/**
 * Generate user display name from first name, last name, and username
 */
export function getUserDisplayName(user: {
  first_name?: string;
  last_name?: string;
  username?: string;
}): string {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Anonymous';
}

/**
 * Generate avatar URL using ui-avatars.com service
 */
export function getUserAvatarUrl(user: {
  first_name?: string;
  last_name?: string;
  username?: string;
}, size: number = 40): string {
  const name = getUserDisplayName(user);
  const initials = getUserInitials(user);
  
  // Use the display name for the avatar, but fallback to initials if needed
  const avatarName = name !== 'Anonymous' ? name : initials;
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random&size=${size}&font-size=0.33`;
}

/**
 * Generate avatar data for creating an initials avatar component
 */
export function getInitialsAvatarData(user: {
  first_name?: string;
  last_name?: string;
  username?: string;
}, className: string = 'h-10 w-10'): {
  initials: string;
  className: string;
  bgColor: string;
} {
  const initials = getUserInitials(user);
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-gray-500'
  ];
  
  // Generate a consistent color based on the user's name/username
  const colorIndex = (user.username || user.first_name || 'U').charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return {
    initials,
    className: `${className} ${bgColor} rounded-full flex items-center justify-center text-white font-medium text-sm`,
    bgColor
  };
}