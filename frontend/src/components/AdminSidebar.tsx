import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOutIcon, LayoutDashboardIcon, UsersIcon, FileTextIcon, TagsIcon, MessageSquareIcon, InfoIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { logout } from '../../utils/auth';

export function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to logout');
      console.error(error);
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col min-h-screen p-4">
      <div className="text-2xl font-bold mb-8">Admin Panel</div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <LayoutDashboardIcon className="h-5 w-5 mr-2" />
              Dashboard
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Users
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/admin/articles"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <FileTextIcon className="h-5 w-5 mr-2" />
              Articles
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/admin/categories-tags"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <TagsIcon className="h-5 w-5 mr-2" />
              Categories & Tags
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/admin/comments"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <MessageSquareIcon className="h-5 w-5 mr-2" />
              Comments
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/admin/contact-info"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`
              }
            >
              <InfoIcon className="h-5 w-5 mr-2" />
              Contact Info
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center p-2 rounded-md w-full text-left hover:bg-gray-700"
        >
          <LogOutIcon className="h-5 w-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}
