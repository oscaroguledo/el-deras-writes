import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth.ts';
import { updateUser } from '../../utils/api';
import { CustomUser } from '../../types/CustomUser';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function AdminProfilePage() {
  const { user, checkAuthStatus } = useAuth();
  const [formData, setFormData] = useState<Partial<CustomUser>>({
    first_name: '',
    last_name: '',
    bio: '',
  });

  useEffect(() => {
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
      await updateUser(user.id, formData);
      toast.success('Profile updated successfully!');
      checkAuthStatus(); // Refresh user data
    } catch (error) {
      toast.error('Failed to update profile.');
      console.error(error);
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        {/* Title Skeleton */}
        <SkeletonLoader className="h-8 w-48 mb-6" />
        <div className="bg-white shadow-lg rounded-xl p-6">
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
      <h1 className="text-3xl font-serif font-medium text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white shadow-lg rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user.username}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-justify"
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
