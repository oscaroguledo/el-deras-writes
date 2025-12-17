import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BlogPostCard } from './BlogPostCard';
import { LazyContent } from './LazyContent';
import SkeletonArticleList from './SkeletonArticleList';
import { Article } from '../types/Article';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazyBlogPostListProps {
  posts: Article[];
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function LazyBlogPostList({
  posts,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  loading = false,
  hasMore = false,
  onLoadMore
}: LazyBlogPostListProps) {
  const [visiblePosts, setVisiblePosts] = useState<Article[]>([]);
  const [loadedCount, setLoadedCount] = useState(6); // Initial load count
  
  const { targetRef: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
    triggerOnce: false
  });

  // Load more posts when intersection is detected
  useEffect(() => {
    if (isIntersecting && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, onLoadMore, loading]);

  // Update visible posts when posts change
  useEffect(() => {
    setVisiblePosts(posts.slice(0, loadedCount));
  }, [posts, loadedCount]);

  const loadMorePosts = useCallback(() => {
    if (loadedCount < posts.length) {
      setLoadedCount(prev => Math.min(prev + 6, posts.length));
    }
  }, [loadedCount, posts.length]);

  return (
    <section className="mt-16 lg:mt-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-gray-900">
          Latest Articles
        </h2>
        <Link to="/" className="text-sm font-medium text-gray-900 hover:underline">
          View all articles →
        </Link>
      </div>
      
      {/* Articles Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post, index) => (
          <LazyContent
            key={post.id}
            fallback={
              <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            }
            threshold={0.1}
            rootMargin="100px"
          >
            <BlogPostCard post={post} />
          </LazyContent>
        ))}
      </div>

      {/* Load More Trigger */}
      {loadedCount < posts.length && (
        <div ref={loadMoreRef} className="flex justify-center mt-8">
          <button
            onClick={loadMorePosts}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Articles'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-8">
          <SkeletonArticleList count={3} />
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onPreviousPage} 
          disabled={currentPage === 1} 
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={onNextPage} 
          disabled={currentPage === totalPages} 
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}