import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { Menu, X, User, LogOut } from 'lucide-react';
import logo from '/logo.webp'; // Import the logo

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button
            className="md:hidden mr-4 text-white"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className="h-8 w-auto mr-2" />
            <span className="text-xl font-bold font-serif">Admin Panel</span>
          </Link>
        </div>
        <div className="relative flex items-center space-x-4">
          <Link to="/" className="text-white hover:text-gray-300 hidden md:block">
            View Site
          </Link>
          <button
            className="flex items-center space-x-2"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <User size={24} />
            <span className="hidden md:block">{user?.username || 'Admin'}</span>
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link
                to="/admin/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <User size={16} className="inline-block mr-2" />
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} className="inline-block mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
