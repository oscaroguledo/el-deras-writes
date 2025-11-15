import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CustomUser } from '../../types/CustomUser';
import { getUsers, deleteUser } from '../../utils/api';
import { UserFormModal } from '../../components/UserFormModal';
import SkeletonLoader from '../../components/SkeletonLoader';

const PAGE_SIZE = 10; // Define page size

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchUsers = useCallback(async (page: number, search: string = '') => { // Accept search parameter
    try {
      setLoading(true);
      const response = await getUsers({ page, page_size: PAGE_SIZE, search }); // Pass search to API
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
    fetchUsers(currentPage); // Only fetch when currentPage changes
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
        fetchUsers(currentPage, searchQuery); // Re-fetch users after deletion
      } catch (error) {
        toast.error('Failed to delete user');
        console.error(error);
      }
    }
  };

  const handleUserFormSubmit = () => {
    setShowUserModal(false);
    fetchUsers(currentPage, searchQuery); // Re-fetch users after form submission
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchClick = () => {
    setCurrentPage(1); // Reset to first page on new search
    fetchUsers(1, searchQuery);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <SkeletonLoader className="h-8 w-64" />
          <SkeletonLoader className="h-10 w-32" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-4 flex items-center space-x-2">
          <SkeletonLoader className="h-10 w-full" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white shadow-lg overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 hidden sm:table-cell">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 hidden lg:table-cell">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                    <SkeletonLoader className="h-4 w-3/4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-10 w-10 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonLoader className="h-4 w-3/4 mb-1" />
                      <SkeletonLoader className="h-4 w-1/2" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <SkeletonLoader className="h-4 w-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <SkeletonLoader className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-medium text-gray-900">Manage Users</h1>
        <button onClick={handleCreateUser} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          <PlusIcon className="h-4 w-4 mr-1" /> Add User
        </button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search users..."
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

      <div className="bg-white shadow-lg overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Picture</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`} alt="User Avatar" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-500">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.user_type === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
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
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalUsers)}</span> of{' '}
              <span className="font-medium">{totalUsers}</span> results
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