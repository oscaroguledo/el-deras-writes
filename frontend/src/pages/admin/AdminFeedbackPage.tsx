import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Trash, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Feedback } from '../../types/Feedback'; // Assuming you'll create this type
import { getFeedback, deleteFeedback } from '../../utils/api'; // Assuming you'll create these API calls
import SkeletonLoader from '../../components/SkeletonLoader';
import { ConfirmationModal } from '../../components/ConfirmationModal';

const PAGE_SIZE = 10;

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDeleteId, setFeedbackToDeleteId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const response = await getFeedback({ page, pageSize: PAGE_SIZE, search });
      console.log('Fetched feedback response:', response);
      setFeedbackList(response.results);
      setTotalFeedbackCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));
    } catch (error) {
      toast.error('Failed to fetch feedback.');
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback(currentPage);
  }, [currentPage, fetchFeedback]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchFeedback(1, searchQuery);
  };

  const handleDeleteFeedback = (id: string) => {
    setFeedbackToDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (feedbackToDeleteId) {
      try {
        await deleteFeedback(feedbackToDeleteId);
        toast.success('Feedback deleted successfully!');
        fetchFeedback(currentPage, searchQuery);
      } catch (error) {
        toast.error('Failed to delete feedback.');
        console.error('Error deleting feedback:', error);
      } finally {
        setShowDeleteModal(false);
        setFeedbackToDeleteId(null);
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
      <div className="p-4 md:p-8">
        {/* Header Skeleton */}
        <SkeletonLoader className="h-8 w-64 mb-6" />

        {/* Search Bar Skeleton */}
        <div className="mb-4 flex items-center space-x-2">
          <SkeletonLoader className="h-10 w-full" />
        </div>

        {/* Mobile Card Layout Skeleton */}
        <div className="block lg:hidden space-y-4 mb-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <SkeletonLoader className="h-5 w-32" />
                <SkeletonLoader className="h-8 w-8 rounded" />
              </div>
              <SkeletonLoader className="h-4 w-48 mb-2" />
              <SkeletonLoader className="h-4 w-full mb-2" />
              <SkeletonLoader className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-full" />
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <SkeletonLoader className="h-4 w-full mb-1" />
                      <SkeletonLoader className="h-3 w-1/2" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-3/4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <SkeletonLoader className="h-5 w-5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Skeleton */}
        <nav className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
      <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-6">Manage Feedback</h1>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search feedback..."
            className="w-full bg-white dark:bg-gray-700 rounded-md py-2 pl-4 pr-10 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-colors duration-200"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4 mb-8">
        {feedbackList.length > 0 ? feedbackList.map(feedback => (
          <div key={feedback.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-colors duration-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{feedback.name}</h3>
              <button 
                onClick={() => handleDeleteFeedback(feedback.id)} 
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200" 
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{feedback.email}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{feedback.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(feedback.created_at).toLocaleDateString()}</p>
          </div>
        )) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No feedback found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl mb-8 transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {feedbackList.length > 0 ? feedbackList.map(feedback => (
                <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{feedback.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{feedback.email}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{feedback.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(feedback.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleDeleteFeedback(feedback.id)} 
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200" 
                      title="Delete"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No feedback found.
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
          className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 transition-colors duration-200"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, feedbackList.length)}</span> of{' '}
              <span className="font-medium">{totalFeedbackCount}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}

      <ConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
      />
    </div>
  );
}