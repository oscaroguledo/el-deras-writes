import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPostCard } from './BlogPostCard';
import { Article } from '../types/Article';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface BlogPostListProps {
  posts: Article[];
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function BlogPostList({
  posts,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage
}: BlogPostListProps) {
  return (
    <section className="mt-16 lg:mt-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">
          Latest Articles
        </h2>
        <Link to="/" className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline">
          View all articles →
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => <BlogPostCard key={post.id} post={post} />)}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onPreviousPage} 
          disabled={currentPage === 1} 
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={onNextPage} 
          disabled={currentPage === totalPages} 
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
