import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { getComments } from '../../utils/api';
import { Comment } from '../../types/Comment';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { debounce } from 'lodash';

const PAGE_SIZE = 10;

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComments = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const response = await getComments({ page, pageSize: PAGE_SIZE, search });
      setComments(response.results);
      setTotalComments(response.count);
      setTotalPages(Math.ceil(response.count / PAGE_SIZE));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to fetch comments.');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchComments = useRef(
    debounce((page: number, search: string) => fetchComments(page, search), 500)
  ).current;

  useEffect(() => {
    debouncedFetchComments(currentPage, searchQuery);
    return () => {
      debouncedFetchComments.cancel();
    };
  }, [currentPage, searchQuery, debouncedFetchComments]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-4">Manage Comments</h1>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search comments..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.length > 0 ? comments.map(comment => (
                <tr key={comment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.article}</td> {/* Assuming article is an ID or object with ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.author?.username || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comment.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No comments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalComments)}</span> of{' '}
              <span className="font-medium">{totalComments}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}

      {/* Mobile List View */}
      <div className="md:hidden bg-white shadow overflow-hidden rounded-lg mb-8">
        {comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="text-sm font-medium text-gray-900">ID: {comment.id}</div>
            <div className="text-sm text-gray-500">Article ID: {comment.article}</div>
            <div className="text-sm text-gray-500">Author: {comment.author?.username || 'N/A'}</div>
            <div className="text-sm text-gray-500">Content: {comment.content}</div>
            <div className="text-sm text-gray-500">Date: {new Date(comment.created_at).toLocaleDateString()}</div>
          </div>
        )) : (
          <div className="p-4 text-center text-sm text-gray-500">No comments found.</div>
        )}
        {/* Pagination Controls for Mobile */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
