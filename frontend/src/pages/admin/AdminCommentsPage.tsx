import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Edit, Trash, CheckCircle, Flag, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Comment } from '../../types/Comment';
import { getComments } from '../../utils/api';
import SkeletonLoader from '../../components/SkeletonLoader';

const PAGE_SIZE = 10;

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0); // New state for total count
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComments = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const response = await getComments({ page, pageSize: PAGE_SIZE, search });
      setComments(response.results || []);
      setTotalCommentsCount(response.count || 0); // Set total count
      setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));
    } catch (error) {
      toast.error('Failed to fetch comments.');
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(currentPage);
  }, [currentPage, fetchComments]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchComments(1, searchQuery);
  };

  const handleApproveComment = async (id: string) => {
    // Implement approve comment logic
    toast.info('Approve comment functionality not yet implemented.');
  };

  const handleFlagComment = async (id: string) => {
    // Implement flag comment logic
    toast.info('Flag comment functionality not yet implemented.');
  };

  const handleDeleteComment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      // Implement delete comment logic
      toast.info('Delete comment functionality not yet implemented.');
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {/* Header Skeleton */}
        <SkeletonLoader className="h-8 w-64 mb-6" />

        {/* Search Bar Skeleton */}
        <div className="mb-4 flex items-center space-x-2">
          <SkeletonLoader className="h-10 w-full" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white shadow-lg overflow-hidden rounded-xl mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <SkeletonLoader className="h-4 w-full mb-1" />
                      <SkeletonLoader className="h-3 w-1/2" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <SkeletonLoader className="h-4 w-3/4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <SkeletonLoader className="h-4 w-3/4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <SkeletonLoader className="h-5 w-5" />
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

        {/* Pagination Skeleton */}
        <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:block">
            <SkeletonLoader className="h-5 w-48" />
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <SkeletonLoader className="h-10 w-24" />
            <SkeletonLoader className="h-10 w-24 ml-3" />
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-6">Manage Comments</h1>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search comments..."
            className="w-full bg-white rounded-md py-2 pl-4 pr-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg overflow-hidden rounded-xl mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Article
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.length > 0 ? comments.map(comment => (
                <tr key={comment.id}>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <div className="text-sm text-gray-900">{comment.content}</div>
                    <div className="text-xs text-gray-500">Posted: {new Date(comment.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">{comment.author?.username || 'Guest'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-900">{comment.article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {comment.approved ? 'Approved' : 'Pending'}
                    </span>
                    {comment.is_flagged && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Flagged
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!comment.approved && (
                        <button onClick={() => handleApproveComment(comment.id)} className="text-green-600 hover:text-green-900" title="Approve">
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {!comment.is_flagged && (
                        <button onClick={() => handleFlagComment(comment.id)} className="text-yellow-600 hover:text-yellow-900" title="Flag">
                          <Flag className="h-5 w-5" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No comments found.
                  </td>
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
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, comments.length)}</span> of{' '}
              <span className="font-medium">{totalCommentsCount}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}