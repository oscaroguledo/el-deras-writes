import React, { useState, useEffect } from 'react';
import { MenuIcon, XIcon, SearchIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getTopFiveCategories } from '../utils/api';
import { Category } from '../types/Category';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topCategories, setTopCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getTopFiveCategories()
      .then(data => setTopCategories(data))
      .catch(error => console.error('Failed to fetch top categories:', error));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-serif font-medium tracking-tight text-gray-900">
              El_Dera's writes
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 py-1 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <SearchIcon className="h-4 w-4" />
              </button>
            </form>
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Contact
              </Link>
              {topCategories.map(category => (
                <Link
                  key={category.id}
                  to={`/?category=${category.name}`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none">
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu - pull up from right side */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Menu</h3>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-4 py-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>
          <nav className="space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            {topCategories.map(category => (
              <Link
                key={category.id}
                to={`/?category=${category.name}`}
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {/* Overlay when menu is open */}
      {isMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
    </header>
  );
}