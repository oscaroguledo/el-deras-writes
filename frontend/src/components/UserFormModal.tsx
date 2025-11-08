import React, { useState, useEffect } from 'react';
import { CustomUser } from '../types/CustomUser';
import { toast } from 'react-toastify';
import { createUser, updateUser } from '../utils/api'; // Need to create these API functions

interface UserFormModalProps {
  show: boolean;
  onClose: () => void;
  user: CustomUser | null;
  onSubmit: () => void;
}

export function UserFormModal({ show, onClose, user, onSubmit }: UserFormModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('normal');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setUserType(user.user_type || 'normal');
      setBio(user.bio || '');
      setPassword(''); // Password should not be pre-filled for security
    } else {
      setUsername('');
      setEmail('');
      setUserType('normal');
      setBio('');
      setPassword('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      username,
      email,
      password,
      user_type: userType,
      bio,
    };

    try {
      if (user) {
        await updateUser(user.id, userData);
        toast.success('User updated successfully!');
      } else {
        await createUser(userData);
        toast.success('User created successfully!');
      }
      onSubmit();
    } catch (error) {
      toast.error('Failed to save user.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{user ? 'Edit User' : 'Create User'}</h3>
          <form onSubmit={handleSubmit} className="mt-2 text-left">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...(!user ? { required: true } : {})}
              />
              {!user && <p className="text-xs text-gray-500 mt-1">Password is required for new users.</p>}
              {user && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password.</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userType">
                User Type
              </label>
              <select
                id="userType"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>
            <div className="items-center px-4 py-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-900 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save User'}
              </button>
              <button
                type="button"
                className="mt-3 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
