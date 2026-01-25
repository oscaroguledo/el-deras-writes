import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth.ts';
import { updateUser } from '../../utils/api';
import { CustomUser } from '../../types/CustomUser';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getUserAvatarUrl, getUserDisplayName } from '../../utils/userUtils';

export default function AdminProfilePage() {
  const { user, checkAuthStatus } = useAuth();
  const [formData, setFormData] = useState<Partial<CustomUser>>({
    first_name: '',
    last_name: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('AdminProfilePage - Current user:', user);
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      console.log('Updating user profile with data:', formData);
      await updateUser(user.id, formData);
      toast.success('Profile updated successfully!');
      await checkAuthStatus(); // Refresh user data
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        {/* Title Skeleton */}
        <SkeletonLoader className="h-8 w-48 mb-6" />
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 md:p-6">
          <div className="space-y-6">
            {/* Username Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Email Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* First Name / Last Name Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SkeletonLoader className="h-4 w-24 mb-1" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
              <div>
                <SkeletonLoader className="h-4 w-24 mb-1" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
            </div>
            {/* Bio Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-24 w-full" />
            </div>
            {/* Save Changes Button Skeleton */}
            <div className="flex justify-end">
              <SkeletonLoader className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">My Profile</h1>
        {user && (
          <div className="flex items-center space-x-3">
            <img 
              className="h-12 w-12 rounded-full border-2 border-gray-200 dark:border-gray-600" 
              src={getUserAvatarUrl(user, 48)} 
              alt={`${getUserDisplayName(user)} Avatar`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.initials-fallback')) {
                  const initials = user.first_name?.charAt(0) || user.last_name?.charAt(0) || user.username?.charAt(0) || 'U';
                  const fallback = document.createElement('div');
                  fallback.className = 'initials-fallback h-12 w-12 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center text-white font-medium text-lg';
                  fallback.textContent = initials.toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getUserDisplayName(user)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 md:p-6 transition-colors duration-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user?.username || ''}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user?.email || ''}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-colors duration-200"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm text-justify transition-colors duration-200"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
