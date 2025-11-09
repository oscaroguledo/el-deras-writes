import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { CustomUser } from '../../types/CustomUser';
import { getUsers, deleteUser } from '../../utils/api';
import { UserFormModal } from '../../components/UserFormModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
        console.error(error);
      }
    }
  };

  const handleUserFormSubmit = () => {
    setShowUserModal(false);
    fetchUsers();
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-serif font-medium text-gray-900">Manage Users</h1>
        <button onClick={handleCreateUser} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          <PlusIcon className="h-4 w-4 mr-1" /> Add User
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.user_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.bio}</td>
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

      {/* Mobile List View */}
      <div className="md:hidden bg-white shadow overflow-hidden rounded-lg">
        {users.length > 0 ? users.map(user => (
          <div key={user.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
              <div className="flex space-x-2">
                <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">
                  <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">Email: {user.email}</div>
            <div className="text-sm text-gray-500">Role: {user.user_type}</div>
            <div className="text-sm text-gray-500">Bio: {user.bio}</div>
          </div>
        )) : (
          <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
        )}
      </div>

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
