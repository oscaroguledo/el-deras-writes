# Lazy Loading and Skeleton Components

This directory contains the lazy loading and skeleton components implementation for the Django + PostgreSQL Enhancement project.

## Components Overview

### Lazy Loading Components

#### `LazyImage`
Progressive image loading component with intersection observer support.
- **Features**: Base64 image support, loading states, error handling, smooth transitions
- **Usage**: Automatically loads images when they enter the viewport
- **Props**: `src`, `alt`, `className`, `placeholder`, `onLoad`, `onError`

#### `LazyContent`
Generic lazy loading wrapper for any content.
- **Features**: Intersection observer, customizable thresholds, fallback content
- **Usage**: Wrap any content to load it only when visible
- **Props**: `children`, `fallback`, `threshold`, `rootMargin`, `triggerOnce`

#### `LazyBlogPostList`
Enhanced blog post list with progressive loading.
- **Features**: Batch loading, infinite scroll, skeleton states
- **Usage**: Replaces standard BlogPostList with lazy loading capabilities
- **Props**: Standard list props + `loading`, `hasMore`, `onLoadMore`

#### `LazyCommentSection`
Comment section with lazy loading and progressive rendering.
- **Features**: Load comments on demand, skeleton states for individual comments
- **Usage**: Replaces standard CommentSection with lazy loading
- **Props**: `articleId`

### Skeleton Components

#### `SkeletonLoader`
Enhanced base skeleton component with multiple animation variants.
- **Variants**: `pulse`, `wave`, `shimmer`
- **Rounded**: `none`, `sm`, `md`, `lg`, `full`
- **Features**: Smooth transitions, customizable animations

#### `SkeletonArticleCard`
Article card skeleton with realistic proportions.
- **Features**: Image placeholder, text lines, metadata sections
- **Usage**: Loading state for article cards

#### `SkeletonArticleList`
Grid of article card skeletons.
- **Features**: Configurable count, responsive grid
- **Usage**: Loading state for article lists

#### `SkeletonCommentCard`
Comment skeleton with author info and content.
- **Features**: Reply threading support, author avatar placeholder
- **Usage**: Loading state for comments

#### `SkeletonUserProfile`
User profile skeleton with optional sections.
- **Features**: Avatar, bio, stats sections
- **Usage**: Loading state for user profiles

### Hooks

#### `useIntersectionObserver`
Custom hook for intersection observer functionality.
- **Features**: Configurable threshold, root margin, trigger once option
- **Returns**: `targetRef`, `isIntersecting`

#### `useProgressiveLoading`
Hook for progressive content loading with batching.
- **Features**: Batch size control, loading states, progress tracking
- **Returns**: `visibleItems`, `hasMore`, `isLoading`, `loadNextBatch`, `progress`

#### `useLoadingState`
Centralized loading state management.
- **Features**: Multiple loading states, any loading check
- **Returns**: `setLoading`, `isLoading`, `isAnyLoading`, `resetLoading`

## Implementation Details

### Intersection Observer Configuration
- **Threshold**: 0.1 (10% visibility)
- **Root Margin**: 50-200px (depending on component)
- **Trigger Once**: True for most components to prevent re-loading

### Animation System
Custom Tailwind animations added:
- `animate-wave`: Wave loading effect
- `animate-shimmer`: Shimmer loading effect  
- `animate-fade-in`: Smooth fade in transition
- `animate-slide-up`: Slide up entrance animation

### Performance Optimizations
1. **Lazy Loading**: Images and content load only when needed
2. **Progressive Loading**: Content loads in batches to prevent overwhelming
3. **Skeleton States**: Immediate visual feedback while content loads
4. **Smooth Transitions**: CSS transitions for better UX
5. **Memory Management**: Proper cleanup of intersection observers

### Browser Support
- **Intersection Observer**: Modern browsers (IE11+ with polyfill)
- **CSS Animations**: All modern browsers
- **Base64 Images**: Universal support

## Usage Examples

### Basic Lazy Image
```tsx
import { LazyImage } from './components/lazy';

<LazyImage 
  src="data:image/jpeg;base64,..." 
  alt="Article image"
  className="w-full h-48 object-cover"
/>
```

### Lazy Content with Skeleton
```tsx
import { LazyContent, SkeletonArticleCard } from './components/lazy';

<LazyContent
  fallback={<SkeletonArticleCard />}
  threshold={0.1}
  rootMargin="100px"
>
  <ArticleCard article={article} />
</LazyContent>
```

### Progressive Loading Hook
```tsx
import { useProgressiveLoading } from './hooks/useProgressiveLoading';

const { visibleItems, hasMore, loadNextBatch } = useProgressiveLoading(
  articles,
  { batchSize: 6, loadDelay: 100 }
);
```

## Requirements Validation

This implementation addresses the following requirements:

### Requirement 6.6 (Frontend State Synchronization)
- Optimized loading states prevent UI blocking
- Progressive loading maintains responsive interface
- Skeleton components provide immediate feedback

### Requirement 9.3 (Performance Optimization)
- Lazy loading reduces initial page load
- Progressive loading prevents memory issues
- Intersection observer optimizes scroll performance
- Image optimization with base64 support

## Testing

The lazy loading components can be tested by:
1. Checking intersection observer triggers
2. Verifying skeleton states appear before content
3. Testing image loading with network throttling
4. Validating smooth transitions between states
5. Ensuring proper cleanup of observers

## Future Enhancements

1. **Virtual Scrolling**: For very large lists
2. **Preloading**: Smart preloading of next batch
3. **Error Recovery**: Retry mechanisms for failed loads
4. **Analytics**: Loading performance metrics
5. **A11y**: Enhanced accessibility features