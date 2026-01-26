import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { CustomUser } from '../../types/CustomUser';
import { getUsers, deleteUser } from '../../utils/api';
import { UserFormModal } from '../../components/UserFormModal';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getUserAvatarUrl, getUserDisplayName } from '../../utils/userUtils';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const response = await getUsers({ page, page_size: PAGE_SIZE, search });
      setUsers(response.results);
      setTotalUsers(response.count);
      setTotalPages(Math.ceil(response.count / PAGE_SIZE));
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: CustomUser) => {
    setCurrentUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers(currentPage, searchQuery);
      } catch (error) {
        toast.error('Failed to delete user');
        console.error(error);
      }
    }
  };

  const handleUserFormSubmit = () => {
    setShowUserModal(false);
    fetchUsers(currentPage, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
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

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <SkeletonLoader className="h-4 w-12" />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <SkeletonLoader className="h-4 w-16" />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    <SkeletonLoader className="h-4 w-20" />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                    <SkeletonLoader className="h-4 w-16" />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <SkeletonLoader className="h-4 w-16" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-24 mb-1" />
                      <SkeletonLoader className="h-3 w-16" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <SkeletonLoader className="h-4 w-32" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <SkeletonLoader className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1 sm:space-x-2">
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
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4 rounded-b-xl">
          <div className="hidden sm:block">
            <SkeletonLoader className="h-5 w-48" />
          </div>
          <div className="flex-1 flex justify-between sm:justify-end space-x-2">
            <SkeletonLoader className="h-10 w-20 sm:w-24" />
            <SkeletonLoader className="h-10 w-20 sm:w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-white">
            Manage Users
          </h1>
        </div>
        <button 
          onClick={handleCreateUser} 
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 w-full sm:w-auto"
        >
          <PlusIcon className="h-4 w-4 mr-2" /> 
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            className="w-full bg-white dark:bg-gray-800 rounded-lg py-2.5 sm:py-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-200 text-sm sm:text-base"
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
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avatar
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Role
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length > 0 ? users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                      <img 
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-gray-200 dark:border-gray-600" 
                        src={getUserAvatarUrl(user, 40)} 
                        alt={`${getUserDisplayName(user)} Avatar`} 
                        onError={(e) => {
                          // Fallback to a simple colored div with initials if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.initials-fallback')) {
                            const initials = user.first_name?.charAt(0) || user.last_name?.charAt(0) || user.username?.charAt(0) || 'U';
                            const fallback = document.createElement('div');
                            fallback.className = 'initials-fallback h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center text-white font-medium text-xs sm:text-sm';
                            fallback.textContent = initials.toUpperCase();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName(user)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                    {/* Show email on mobile */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {user.email}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                      user.user_type === 'admin' 
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)} 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded transition-colors duration-200"
                        title="Edit user"
                      >
                        <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded transition-colors duration-200"
                        title="Delete user"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                    {/* Show role on mobile */}
                    <div className="lg:hidden mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                        user.user_type === 'admin' 
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {user.user_type}
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            fetchUsers(1, '');
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4 rounded-b-xl space-y-3 sm:space-y-0">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalUsers)}</span> of{' '}
              <span className="font-medium">{totalUsers}</span> results
            </p>
          </div>
          <div className="flex justify-center sm:justify-end space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> 
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
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

      {showUserModal && (
        <UserFormModal
          show={showUserModal}
          onClose={() => setShowUserModal(false)}
          user={currentUser}
          onSubmit={handleUserFormSubmit}
        />
      )}
    </div>
  );
}