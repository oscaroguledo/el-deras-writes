import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroPost } from '../components/HeroPost';
import { BlogPostList } from '../components/BlogPostList';
import { getArticles } from '../utils/api';
import { Article } from '../types/Article';
import { CategoryList } from '../components/CategoryList';

export function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryFilter = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [topCategories, setTopCategories] = useState<Category[]>([]); // Add state for top categories

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 10; // This should match the backend's page_size

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [articlesResponse, categoriesResponse] = await Promise.all([
          getArticles({
            search: searchQuery,
            category: categoryFilter,
            page: currentPage,
            page_size: articlesPerPage,
          }),
          getTopFiveCategories(), // Fetch top categories in parallel
        ]);

        // Set the first article as featured if available
        if (articlesResponse.results.length > 0) {
          setFeaturedArticle(articlesResponse.results[0]);
          setArticles(articlesResponse.results.slice(1));
        } else {
          setFeaturedArticle(null);
          setArticles([]);
        }
        setTotalPages(Math.ceil(articlesResponse.count / articlesPerPage));
        setTopCategories(categoriesResponse); // Set top categories
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
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
          <CategoryList categories={topCategories} />
        </div>
      </div>
    </>
  );
}
