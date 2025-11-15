import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, deleteArticle } from '../../utils/api';
import { Article } from '../../types/Article';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { debounce } from 'lodash';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchArticles = useCallback(async (page: number, search: string = '') => { // Accept search parameter
    try {
      setLoading(true);
      const data = await getArticles({ page, pageSize: 10, search }); // Pass search to API
      setArticles(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      toast.error('Failed to fetch articles.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  const debouncedFetchArticles = useRef(
    debounce((page: number, search: string) => fetchArticles(page, search), 500)
  ).current;

  useEffect(() => {
    debouncedFetchArticles(currentPage, searchQuery);
    return () => {
      debouncedFetchArticles.cancel();
    };
  }, [currentPage, searchQuery, debouncedFetchArticles]);

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        setDeleting(id);
        await deleteArticle(id);
        setArticles(articles.filter(article => article.id !== id)); // Use article.id
        toast.success('Article deleted successfully');
        // Re-fetch articles to ensure list is up-to-date and pagination correct
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-serif font-medium text-gray-900">Manage Articles</h1>
        <Link to="/admin/articles/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          <Plus className="h-4 w-4 mr-1" /> New Article
        </Link>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search articles..."
          className="w-full bg-white rounded-md py-2 pl-10 pr-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.length > 0 ? articles.map(article => (
                <tr key={article.id}> {/* Use article.id here */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded object-cover" src={article.image} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {article.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.author.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/admin/articles/edit/${article.id}`} className="text-indigo-600 hover:text-indigo-900"> {/* Use article.id here */}
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button onClick={() => handleDeleteArticle(article.id)} disabled={deleting === article.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"> {/* Use article.id here */}
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No articles found. Create your first article or adjust search criteria!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden bg-white shadow overflow-hidden rounded-lg mb-8">
        {articles.length > 0 ? articles.map(article => (
          <div key={article.id} className="border-b border-gray-200 p-4 last:border-b-0"> {/* Use article.id here */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-medium text-gray-900">{article.title}</div>
              <div className="flex space-x-2">
                <Link to={`/admin/articles/edit/${article.id}`} className="text-indigo-600 hover:text-indigo-900"> {/* Use article.id here */}
                  <Edit className="h-5 w-5" />
                </Link>
                <button onClick={() => handleDeleteArticle(article.id)} disabled={deleting === article.id} className="text-red-600 hover:text-red-900 disabled:opacity-50"> {/* Use article.id here */}
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-1">Category: {article.category.name}</div>
            <div className="text-sm text-gray-500 mb-1">Author: {article.author.username}</div>
            <div className="text-sm text-gray-500">Date: {new Date(article.createdAt).toLocaleDateString()}</div>
          </div>
        )) : (
          <div className="p-4 text-center text-sm text-gray-500">No articles found. Create your first article or adjust search criteria!</div>
        )}
        {/* Pagination Controls for Mobile */}
        <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
