import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { Menu, User, LogOut, Search } from 'lucide-react';
import logo from '/logo.webp';
import { adminSearch } from '../utils/api';
import { debounce } from 'lodash';
import { SearchResult } from '../types/Admin';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const userInitials = user
    ? `${user.first_name ? user.first_name[0] : ''}${user.last_name ? user.last_name[0] : ''}`.toUpperCase() || 'AD'
    : 'AD';

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const performSearch = async (query: string) => {
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    try {
      const results = await adminSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const debouncedSearch = useRef(debounce(performSearch, 300)).current;

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleResultClick = (url: string) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(url);
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

          </Link>
        </div>

        <div className="relative flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for articles, users, etc..."
              className="w-full bg-gray-700 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 100)}
            />
          </div>
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg z-50">
              <ul>
                {searchResults.map((result) => (
                  <li
                    key={`${result.type}-${result.id}`}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleResultClick(result.url)}
                  >
                    <span className="font-bold">{result.type}:</span> {result.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative flex items-center space-x-4">
          <Link to="/" className="text-white hover:text-gray-300 hidden md:block">
            View Site
          </Link>
          <button
            className="flex items-center space-x-2"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {userInitials}
            </div>
            <span className="hidden md:block">{user?.username || 'Admin'}</span>
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
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