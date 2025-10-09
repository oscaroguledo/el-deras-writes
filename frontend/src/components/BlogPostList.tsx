import React from 'react';
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
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-gray-900">
          Latest Articles
        </h2>
        <a href="#" className="text-sm font-medium text-gray-900 hover:underline">
          View all articles →
        </a>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => <BlogPostCard key={post._id} post={post} />)}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-8">
        <button onClick={onPreviousPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={onNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
