import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CustomUser } from '../../types/CustomUser';
import { createUser, updateUser } from '../utils/api';

interface UserFormModalProps {
  show: boolean;
  onClose: () => void;
  user: CustomUser | null;
  onSubmit: () => void;
}

export function UserFormModal({ show, onClose, user, onSubmit }: UserFormModalProps) {
  const [formData, setFormData] = useState<Partial<CustomUser>>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    title: '', // Initialize new title field
    bio: '',
    user_type: 'normal',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
        user_type: user.user_type,
        password: '', // Password should not be pre-filled for security
      });
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        bio: '',
        user_type: 'normal',
        password: '',
      });
    }
    setErrors({});
  }, [user, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (user) {
        // Update user
        await updateUser(user.id, formData);
        toast.success('User updated successfully!');
      } else {
        // Create user
        await createUser(formData);
        toast.success('User created successfully!');
      }
      onSubmit();
      onClose();
    } catch (err: any) {
      if (err.response && err.response.data) {
        setErrors(err.response.data);
        toast.error('Please correct the errors in the form.');
      } else {
        toast.error('An unexpected error occurred.');
      }
      console.error('User form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{user ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
            {errors.username && <p className="text-red-500 text-xs italic">{errors.username}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
            {errors.email && <p className="text-red-500 text-xs italic">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="first_name" className="block text-gray-700 text-sm font-bold mb-2">First Name:</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.first_name && <p className="text-red-500 text-xs italic">{errors.first_name}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="last_name" className="block text-gray-700 text-sm font-bold mb-2">Last Name:</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.last_name && <p className="text-red-500 text-xs italic">{errors.last_name}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.title && <p className="text-red-500 text-xs italic">{errors.title}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">Bio:</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-justify"
            ></textarea>
            {errors.bio && <p className="text-red-500 text-xs italic">{errors.bio}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="user_type" className="block text-gray-700 text-sm font-bold mb-2">User Type:</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type || 'normal'}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="normal">Normal</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
            {errors.user_type && <p className="text-red-500 text-xs italic">{errors.user_type}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password: {user ? '(Leave blank to keep current)' : ''}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              {...(!user && { required: true })} // Required only for new users
            />
            {errors.password && <p className="text-red-500 text-xs italic">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Add User')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
