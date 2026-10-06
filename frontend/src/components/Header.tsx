import React, { useState, useEffect, useRef } from 'react';
import { MenuIcon, XIcon, SearchIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/CategoryProvider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sections } = useCategories();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        } else if (mobileSearchInputRef.current) {
          setIsMenuOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-serif font-medium tracking-tight text-gray-900 dark:text-gray-100">
              El Dera's writes
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search articles... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 py-1 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <SearchIcon className="h-4 w-4" />
              </button>
            </form>
            <nav className="flex space-x-8">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium">
                Contact
              </Link>
              {sections.map(section => (
                <div key={section.id} className="relative group">
                  <Link
                    to={`/?category=${encodeURIComponent(section.slug)}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 text-sm font-medium whitespace-nowrap"
                  >
                    {section.name}
                  </Link>
                  {section.children.length > 0 && (
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition absolute left-0 top-full pt-2 z-50">
                      <ul className="min-w-[14rem] rounded-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                        {section.children.map(child => (
                          <li key={child.id}>
                            <Link
                              to={`/?category=${encodeURIComponent(child.slug)}`}
                              className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none">
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu - pull up from right side */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Menu</h3>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-4 py-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>
          <nav className="space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-md" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            {sections.map(section => (
              <div key={section.id} className="pt-2">
                <Link
                  to={`/?category=${encodeURIComponent(section.slug)}`}
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {section.name}
                </Link>
                {section.children.map(child => (
                  <Link
                    key={child.id}
                    to={`/?category=${encodeURIComponent(child.slug)}`}
                    className="block pl-7 pr-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>
      {/* Overlay when menu is open */}
      {isMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
    </header>
  );
}