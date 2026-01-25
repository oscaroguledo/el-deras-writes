import { toast } from 'react-toastify';
import { Edit, Trash, CheckCircle, Flag, ChevronLeft, ChevronRight, Search, MessageSquare, User, Calendar } from 'lucide-react';
import { Comment } from '../../types/Comment';
import { getComments, approveComment, deleteComment, flagComment } from '../../utils/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 10;

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);

  const fetchComments = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const response = await getComments({ page, pageSize: PAGE_SIZE, search });
      setComments(response);
      setTotalCommentsCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));
    } catch (error) {
      toast.error('Failed to fetch comments.');
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
    try {
      await approveComment(id);
      toast.success('Comment approved successfully!');
      fetchComments(currentPage, searchQuery);
    } catch (error) {
      toast.error('Failed to approve comment.');
      console.error('Error approving comment:', error);
    }
  };

  const handleFlagComment = async (id: string) => {
    try {
      await flagComment(id);
      toast.success('Comment flagged successfully!');
      fetchComments(currentPage, searchQuery);
    } catch (error) {
      toast.error('Failed to flag comment.');
    }
  };

  const handleDeleteComment = async (id: string) => {
    setCommentToDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (commentToDeleteId) {
      try {
        await deleteComment(commentToDeleteId);
        toast.success('Comment deleted successfully!');
        fetchComments(currentPage, searchQuery);
      } catch (error) {
        toast.error('Failed to delete comment.');
        console.error('Error deleting comment:', error);
      } finally {
        setShowDeleteModal(false);
        setCommentToDeleteId(null);
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
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <SkeletonLoader className="h-8 w-64" />
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
                    <td className="px-3 sm:px-6 py-4">
                      <SkeletonLoader className="h-4 w-full mb-1" />
                      <SkeletonLoader className="h-3 w-1/2" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <SkeletonLoader className="h-4 w-24" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <SkeletonLoader className="h-4 w-32" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
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

        {/* Card Skeleton (Mobile/Tablet) */}
        <div className="lg:hidden space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <SkeletonLoader className="h-4 w-3/4" />
                <div className="flex space-x-2">
                  <SkeletonLoader className="h-5 w-5" />
                  <SkeletonLoader className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <SkeletonLoader className="h-4 w-1/2" />
                <SkeletonLoader className="h-4 w-1/3" />
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
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <MessageSquare className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-gray-900 dark:text-white">
          Manage Comments
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search comments by content, author, or article..."
            className="w-full bg-white dark:bg-gray-800 rounded-lg py-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-transparent transition-colors duration-200"
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
                  Comment
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Author
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Article
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
              {comments?.length > 0 ? comments.map(comment => (
                <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white line-clamp-3 max-w-xs">
                      {comment.content}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <div className="text-sm text-gray-900 dark:text-white">
                        {comment.author?.username || 'Anonymous'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-900 dark:text-white line-clamp-2 max-w-xs">
                      {comment.article?.title || 'Unknown Article'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                        comment.approved 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {comment.approved ? 'Approved' : 'Pending'}
                      </span>
                      {comment.is_flagged && (
                        <span className="inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!comment.approved && (
                        <button 
                          onClick={() => handleApproveComment(comment.id)} 
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded transition-colors duration-200" 
                          title="Approve comment"
                        >
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      {!comment.is_flagged && (
                        <button 
                          onClick={() => handleFlagComment(comment.id)} 
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1 rounded transition-colors duration-200" 
                          title="Flag comment"
                        >
                          <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteComment(comment.id)} 
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded transition-colors duration-200" 
                        title="Delete comment"
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
                      <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No comments found matching your search.' : 'No comments found.'}
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            fetchComments(1, '');
                          }}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm"
                        >
                          Clear search
                        </button>
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
        {comments?.length > 0 ? comments.map(comment => (
          <div key={comment.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-4">
                <p className="text-sm text-gray-900 dark:text-white line-clamp-3 mb-2">
                  {comment.content}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {comment.author?.username || 'Anonymous'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  Article: {comment.article?.title || 'Unknown'}
                </div>
              </div>
              <div className="flex space-x-2">
                {!comment.approved && (
                  <button 
                    onClick={() => handleApproveComment(comment.id)} 
                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded transition-colors duration-200"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                )}
                {!comment.is_flagged && (
                  <button 
                    onClick={() => handleFlagComment(comment.id)} 
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 p-1 rounded transition-colors duration-200"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteComment(comment.id)} 
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded transition-colors duration-200"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                comment.approved 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              }`}>
                {comment.approved ? 'Approved' : 'Pending'}
              </span>
              {comment.is_flagged && (
                <span className="inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  Flagged
                </span>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'No comments found matching your search.' : 'No comments found.'}
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchComments(1, '');
                }}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, comments.length)}</span> of{' '}
              <span className="font-medium">{totalCommentsCount}</span> results
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

      <ConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />
    </div>
  );
}