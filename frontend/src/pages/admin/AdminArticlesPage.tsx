import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, deleteArticle } from '../../utils/api';
import { Article } from '../../types/Article';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Search, FileText, Eye, Calendar } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import { LazyImage } from '../../components/LazyImage';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArticles = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const data = await getArticles({ page, pageSize: 10, search });
      setArticles(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      toast.error('Failed to fetch articles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, fetchArticles]);

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        setDeleting(id);
        await deleteArticle(id);
        setArticles(articles.filter(article => article.id !== id));
        toast.success('Article deleted successfully');
        fetchArticles(currentPage, searchQuery);
      } catch (error) {
        toast.error('Failed to delete article');
        console.error(error);
      } finally {
        setDeleting(null);
      }
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchArticles(1, searchQuery);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <SkeletonLoader className="h-8 w-64" />
          <SkeletonLoader className="h-10 w-full sm:w-32" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <SkeletonLoader className="h-10 w-full" />
        </div>

        {/* Table Skeleton (Desktop) */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <SkeletonLoader className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SkeletonLoader className="h-10 w-10 rounded mr-4" />
                        <SkeletonLoader className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-24" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-20" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <SkeletonLoader className="h-5 w-5" />
                        <SkeletonLoader className="h-5 w-5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Skeleton (Mobile/Tablet) */}
        <div className="lg:hidden space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <SkeletonLoader className="h-6 w-3/4" />
                <div className="flex space-x-2">
                  <SkeletonLoader className="h-5 w-5" />
                  <SkeletonLoader className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <SkeletonLoader className="h-4 w-1/2" />
                <SkeletonLoader className="h-4 w-1/3" />
                <SkeletonLoader className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
          <SkeletonLoader className="h-5 w-48" />
          <div className="flex space-x-2">
            <SkeletonLoader className="h-10 w-20" />
            <SkeletonLoader className="h-10 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-gray-900 dark:text-white">
            Manage Articles
          </h1>
        </div>
        <Link 
          to="/admin/articles/create" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">New Article</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles by title, author, or category..."
            className="w-full bg-white dark:bg-gray-800 rounded-lg py-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-colors duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchClick();
              }
            }}
          />
          <button
            onClick={handleSearchClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Article
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {articles.length > 0 ? articles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <LazyImage 
                          src={article.image || ''} 
                          alt={article.title}
                          className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-600"
                          fallbackType="article"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(article.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {article.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {typeof article.author === 'string' 
                      ? article.author 
                      : article.author 
                        ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || article.author.username || 'Unknown'
                        : 'Unknown'
                    }
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {article.status}
                    </span>
                    {article.views !== undefined && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.views} views
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/admin/articles/edit/${article.id}`} 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded transition-colors duration-200"
                        title="Edit article"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteArticle(article.id)} 
                        disabled={deleting === article.id} 
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 p-1 rounded transition-colors duration-200"
                        title="Delete article"
                      >
                        <Trash className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No articles found matching your search.' : 'No articles found.'}
                      </div>
                      {searchQuery ? (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            fetchArticles(1, '');
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm"
                        >
                          Clear search
                        </button>
                      ) : (
                        <Link
                          to="/admin/articles/create"
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm"
                        >
                          Create your first article
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {articles.length > 0 ? articles.map(article => (
          <div key={article.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {article.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    {article.category || 'Uncategorized'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                    article.status === 'published' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {article.status}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link 
                  to={`/admin/articles/edit/${article.id}`} 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded transition-colors duration-200"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => handleDeleteArticle(article.id)} 
                  disabled={deleting === article.id} 
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 p-1 rounded transition-colors duration-200"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>By {typeof article.author === 'string' 
                  ? article.author 
                  : article.author 
                    ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || article.author.username || 'Unknown'
                    : 'Unknown'
                }</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(article.created_at).toLocaleDateString()}
                </div>
              </div>
              {article.views !== undefined && (
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.views}
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No articles found matching your search.' : 'No articles found.'}
            </div>
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchArticles(1, '');
                }}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm"
              >
                Clear search
              </button>
            ) : (
              <Link
                to="/admin/articles/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first article
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex justify-center sm:justify-end space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1" />
            </button>
          </div>
          {/* Mobile pagination info */}
          <div className="sm:hidden">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
