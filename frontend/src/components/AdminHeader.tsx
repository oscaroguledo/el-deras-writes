import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOutIcon, SettingsIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function AdminHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/admin/dashboard" className="text-xl font-semibold">
          Admin Dashboard
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/admin/settings" className="hover:text-gray-300">
            <SettingsIcon className="h-5 w-5" />
          </Link>
          <button onClick={handleLogout} className="flex items-center space-x-2 hover:text-gray-300">
            <LogOutIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
