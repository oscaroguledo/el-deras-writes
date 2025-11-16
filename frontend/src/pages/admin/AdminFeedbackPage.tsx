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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
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
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-6">Manage Feedback</h1>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search feedback..."
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
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
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
              {feedbackList.length > 0 ? feedbackList.map(feedback => (
                <tr key={feedback.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{feedback.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{feedback.email}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <div className="text-sm text-gray-900">{feedback.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(feedback.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDeleteFeedback(feedback.id)} className="text-red-600 hover:text-red-900" title="Delete">
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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
          className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, feedbackList.length)}</span> of{' '}
              <span className="font-medium">{totalFeedbackCount}</span> results
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