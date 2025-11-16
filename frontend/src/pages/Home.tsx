import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroPost } from '../components/HeroPost';
import { BlogPostList } from '../components/BlogPostList';
import { getArticles } from '../utils/api'; // Removed getTopFiveCategories
import { Article } from '../types/Article';
import { CategoryList } from '../components/CategoryList';
import SkeletonLoader from '../components/SkeletonLoader';
import { useCategories } from '../hooks/CategoryProvider'; // Import useCategories hook

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryFilter = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  // Removed topCategories state

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 10; // This should match the backend's page_size

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories(); // Use the hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const articlesResponse = await getArticles({ // Removed categoriesResponse from Promise.all
          search: searchQuery,
          category: categoryFilter,
          page: currentPage,
          page_size: articlesPerPage,
        });

        // Set the first article as featured if available
        if (articlesResponse.results.length > 0) {
          setFeaturedArticle(articlesResponse.results[0]);
          setArticles(articlesResponse.results.slice(1));
        } else {
          setFeaturedArticle(null);
          setArticles([]);
        }
        setTotalPages(Math.ceil(articlesResponse.count / articlesPerPage));
        // Removed setTopCategories
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery, categoryFilter, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading || categoriesLoading) { // Include categoriesLoading in overall loading state
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {/* Main content area skeleton */}
        <div className="md:col-span-2">
          {/* HeroPost skeleton */}
          <SkeletonLoader className="h-64 w-full mb-8" />
          {/* BlogPostList skeleton */}
          {[...Array(articlesPerPage - 1)].map((_, index) => ( // -1 because one is hero
            <div key={index} className="mb-6">
              <SkeletonLoader className="h-6 w-3/4 mb-2" />
              <SkeletonLoader className="h-4 w-full mb-1" />
              <SkeletonLoader className="h-4 w-5/6" />
            </div>
          ))}
        </div>
        {/* Sidebar skeleton */}
        <div className="md:col-span-1">
          <SkeletonLoader className="h-8 w-1/2 mb-4" /> {/* Category List Title */}
          {[...Array(5)].map((_, index) => (
            <SkeletonLoader key={index} className="h-6 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return <div className="text-red-500 text-center mt-8">{categoriesError}</div>;
  }

  return (
    <>
      {searchQuery && (
        <div className="mt-8 mb-4">
          <h2 className="text-xl font-medium">
            Search results for:{' '}
            <span className="font-bold">"{searchQuery}"</span>
          </h2>
        </div>
      )}
      {categoryFilter && (
        <div className="mt-8 mb-4">
          <h2 className="text-xl font-medium">
            Category: <span className="font-bold">{categoryFilter}</span>
          </h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {featuredArticle && !searchQuery && !categoryFilter && (
            <HeroPost post={featuredArticle} />
          )}
          <BlogPostList
            posts={articles}
            currentPage={currentPage}
            totalPages={totalPages}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
          {articles.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <CategoryList categories={categories} /> {/* Use categories from the hook */}
        </div>
      </div>
    </>
  );
}
