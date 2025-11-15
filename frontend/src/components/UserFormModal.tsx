import React, { useState, useEffect } from 'react';
import { CustomUser } from '../types/CustomUser';
import { toast } from 'react-toastify';
import { createUser, updateUser } from '../utils/api';
import { X, Eye, EyeOff } from 'lucide-react';

interface UserFormModalProps {
  show: boolean;
  onClose: () => void;
  user: CustomUser | null;
  onSubmit: () => void;
}

export function UserFormModal({ show, onClose, user, onSubmit }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    user_type: 'normal',
    bio: '',
    first_name: '', // Add first_name
    last_name: '',  // Add last_name
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        user_type: user.user_type || 'normal',
        bio: user.bio || '',
        first_name: user.first_name || '', // Initialize first_name
        last_name: user.last_name || '',  // Initialize last_name
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        user_type: 'normal',
        bio: '',
        first_name: '',
        last_name: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        await updateUser(user.id, formData);
        toast.success('User updated successfully!');
      } else {
        await createUser(formData);
        toast.success('User created successfully!');
      }
      onSubmit();
    } catch (error: any) {
      console.error('Error saving user:', error);
      let errorMessage = 'Failed to save user.';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.username) { // Specific for username uniqueness
          errorMessage = `Username: ${error.response.data.username.join(', ')}`;
        } else if (error.response.data.email) { // Specific for email uniqueness
          errorMessage = `Email: ${error.response.data.email.join(', ')}`;
        } else {
          // Attempt to parse other common error structures
          errorMessage = Object.values(error.response.data).flat().join(', ') || errorMessage;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-serif font-medium text-gray-900">{user ? 'Edit User' : 'Create User'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="first_name">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="mt-1 block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
                {...(!user ? { required: true } : {})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!user && <p className="text-xs text-gray-500 mt-1">Password is required for new users.</p>}
            {user && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="user_type">
              User Type
            </label>
            <select
              id="user_type"
              name="user_type"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.user_type}
              onChange={handleChange}
            >
              <option value="normal">Normal</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.bio}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
