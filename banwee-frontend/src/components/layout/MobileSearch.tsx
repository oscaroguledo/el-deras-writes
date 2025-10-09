import React, { useEffect, useState, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}
export const MobileSearch: React.FC<MobileSearchProps> = ({
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products/search?q=${encodeURIComponent(searchTerm)}`);
      onClose();
    }
  };
  // Recent searches (mock data)
  const recentSearches = ['Organic quinoa', 'Moringa powder', 'Shea butter', 'African coffee'];
  // Popular categories (mock data)
  const popularCategories = [{
    name: 'Spices',
    path: '/products/spices-herbs'
  }, {
    name: 'Superfoods',
    path: '/products/superfoods'
  }, {
    name: 'Oils',
    path: '/products/oilseeds'
  }, {
    name: 'Nuts',
    path: '/products/nuts-flowers-beverages'
  }];
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.2
    }}>
          <motion.div className="bg-white w-full" initial={{
        y: '-100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '-100%'
      }} transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-main">
                  Search Products
                </h3>
                <button onClick={onClose} className="p-1">
                  <XIcon size={24} />
                </button>
              </div>
              <form onSubmit={handleSearch} className="flex w-full mb-4">
                <input ref={inputRef} type="text" placeholder="Search for products..." className="flex-grow px-4 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button type="submit" className="bg-primary text-white px-4 py-3 rounded-r-md hover:bg-primary-dark transition-colors">
                  <SearchIcon size={20} />
                </button>
              </form>
              {/* Recent Searches */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Recent Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => <button key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200" onClick={() => {
                setSearchTerm(term);
                navigate(`/products/search?q=${encodeURIComponent(term)}`);
                onClose();
              }}>
                      {term}
                    </button>)}
                </div>
              </div>
              {/* Popular Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Popular Categories
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {popularCategories.map((category, index) => <button key={index} className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200 text-left" onClick={() => {
                navigate(category.path);
                onClose();
              }}>
                      {category.name}
                    </button>)}
                </div>
              </div>
            </div>
          </motion.div>
          {/* Backdrop to close search */}
          <div className="flex-grow" onClick={onClose}></div>
        </motion.div>}
    </AnimatePresence>;
};