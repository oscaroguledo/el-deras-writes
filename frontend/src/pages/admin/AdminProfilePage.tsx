import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth.ts';
import { updateUser } from '../../utils/api';
import { CustomUser } from '../../types/CustomUser';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getUserAvatarUrl, getUserDisplayName } from '../../utils/userUtils';
import { User, Mail, Calendar, Shield, Edit3 } from 'lucide-react';

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
    console.log('AdminProfilePage - User keys:', user ? Object.keys(user) : 'No user');
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  if (!user) {
    return (
      <div className="p-3 sm:p-4 md:p-8">
        {/* Title Skeleton */}
        <SkeletonLoader className="h-6 sm:h-8 w-32 sm:w-48 mb-4 sm:mb-6" />
        
        {/* Profile Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <SkeletonLoader className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="text-center sm:text-left space-y-2">
              <SkeletonLoader className="h-6 w-32" />
              <SkeletonLoader className="h-4 w-24" />
              <SkeletonLoader className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Username Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-20 mb-2" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Email Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-16 mb-2" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* First Name / Last Name Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <SkeletonLoader className="h-4 w-20 mb-2" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
              <div>
                <SkeletonLoader className="h-4 w-20 mb-2" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
            </div>
            {/* Bio Field Skeleton */}
            <div>
              <SkeletonLoader className="h-4 w-12 mb-2" />
              <SkeletonLoader className="h-20 sm:h-24 w-full" />
            </div>
            {/* Save Changes Button Skeleton */}
            <div className="flex justify-end">
              <SkeletonLoader className="h-10 w-24 sm:w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-8">
      {/* Page Header */}
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">
          My Profile
        </h1>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 mb-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <img 
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-gray-200 dark:border-gray-600 shadow-lg" 
              src={getUserAvatarUrl(user, 96)} 
              alt={`${getUserDisplayName(user)} Avatar`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.initials-fallback')) {
                  const initials = user.first_name?.charAt(0) || user.last_name?.charAt(0) || user.username?.charAt(0) || 'U';
                  const fallback = document.createElement('div');
                  fallback.className = 'initials-fallback h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg';
                  fallback.textContent = initials.toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getUserDisplayName(user)}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
              @{user.username}
            </p>
            
            {/* User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="truncate">{user.email}</span>
              </div>
              
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.user_type === 'admin' 
                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                }`}>
                  {user.user_type}
                </span>
              </div>
              
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Joined {formatDate(user.date_joined)}</span>
              </div>
            </div>

            {/* Bio Preview */}
            {user.bio && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{user.bio}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 transition-colors duration-200">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <Edit3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Profile
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={user?.username || ''}
                disabled
                className="block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 text-sm sm:text-base transition-colors duration-200 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Username cannot be changed</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user?.email || ''}
                disabled
                className="block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 text-sm sm:text-base transition-colors duration-200 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio || ''}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors duration-200 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  first_name: user?.first_name || '',
                  last_name: user?.last_name || '',
                  bio: user?.bio || '',
                });
              }}
              className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
