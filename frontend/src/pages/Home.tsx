import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroPost } from '../components/HeroPost';
import { BlogPostList } from '../components/BlogPostList';
import { getArticles } from '../utils/api';
import { Article } from '../types/Article';

export function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryFilter = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 10; // This should match the backend's page_size

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const articlesResponse = await getArticles({
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
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
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
    </>
  );
}
