import React, { useEffect, useState, lazy, Component } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ChevronDownIcon, SearchIcon, UserIcon, HeartIcon, ShoppingCartIcon, MenuIcon, PhoneIcon, GlobeIcon, ShieldIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
interface HeaderProps {
  onSearchClick: () => void;
  onCategoriesClick: () => void;
}
const TopHeaderAds = ['Free shipping on orders over $50', 'Summer sale! Up to 50% off', 'New arrivals every week'];
export const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  onCategoriesClick
}) => {
  const {
    isAuthenticated,
    user,
    isAdmin
  } = useAuth();
  const {
    totalItems
  } = useCart();
  const {
    items: wishlistItems
  } = useWishlist();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  // Categories for dropdown
  const categories = [{
    name: 'Cereal Crops',
    path: '/products/cereal-crops'
  }, {
    name: 'Brands',
    path: '/products/brands'
  }, {
    name: 'Legumes',
    path: '/products/legumes'
  }, {
    name: 'Fruits & Vegetables',
    path: '/products/fruits-vegetables'
  }, {
    name: 'Oilseeds',
    path: '/products/oilseeds'
  }, {
    name: 'Fibers',
    path: '/products/fibers'
  }, {
    name: 'Spices and Herbs',
    path: '/products/spices-herbs'
  }, {
    name: 'Meat, Fish & Sweeteners',
    path: '/products/meat-fish-sweeteners'
  }, {
    name: 'Nuts, Flowers & Beverages',
    path: '/products/nuts-flowers-beverages'
  }];
  // Language and currency options
  const languages = ['English', 'العربية', '简体中文', 'اردو'];
  const currencies = [{
    code: 'EUR',
    symbol: '€',
    country: 'France'
  }, {
    code: 'EUR',
    symbol: '€',
    country: 'Germany'
  }, {
    code: 'USD',
    symbol: '$',
    country: 'United States'
  }, {
    code: 'VND',
    symbol: '₫',
    country: 'Vietnam'
  }];
  // Rotate through ads
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex(prevIndex => (prevIndex + 1) % TopHeaderAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  // Detect scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  return <header className="w-full">
      {/* Top Header - Desktop only */}
      <div className="hidden md:block bg-gray-100 dark:bg-gray-800 text-main dark:text-gray-200">
        <div className="container mx-auto px-4 py-2 max-w-[1400px]">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-8">
              <Link to="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/blog" className="hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/account/orders" className="hover:text-primary transition-colors">
                Orders
              </Link>
              {isAdmin && <Link to="/admin" className="hover:text-primary transition-colors flex items-center">
                  <ShieldIcon size={14} className="mr-1" />
                  Admin
                </Link>}
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <PhoneIcon size={16} className="mr-1" />
                <span>Need help? Call Us: +18001090</span>
              </div>
              <div className="group relative">
                <button className="flex items-center hover:text-primary">
                  <GlobeIcon size={16} className="mr-1" />
                  <span>USD $ | United States</span>
                  <ChevronDownIcon size={16} />
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 w-48 z-50">
                  {currencies.map((currency, index) => <button key={index} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                      {currency.code} {currency.symbol} | {currency.country}
                    </button>)}
                </div>
              </div>
              <div className="group relative">
                <button className="flex items-center hover:text-primary">
                  <span>English</span>
                  <ChevronDownIcon size={16} />
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 w-32 z-50">
                  {languages.map((language, index) => <button key={index} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                      {language}
                    </button>)}
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      {/* Middle Header - Ads Banner */}
      <div className="bg-primary text-white py-2">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <motion.div key={currentAdIndex} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} transition={{
          duration: 0.5
        }} className="text-center">
            {TopHeaderAds[currentAdIndex]}
          </motion.div>
        </div>
      </div>
      {/* Main Header */}
      <div className={`bg-white dark:bg-gray-900 ${isScrolled ? 'shadow-md' : ''} transition-all duration-300`}>
        <div className="container mx-auto px-4 py-4 max-w-[1400px]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center">
                {/* Logo for desktop */}
                <div className="hidden md:flex items-center">
                  <img src="/banwe_logo_green.png" alt="Banwee Logo" className="h-10 md:h-12 mr-2" loading="lazy" />
                  <img src="/banwee_logo_text_green.png" alt="Banwee" className="h-6 md:h-8" loading="lazy" />
                </div>
                {/* Favicon for mobile */}
                <div className="md:hidden">
                  <img src="/banwe_logo_green.png" alt="Banwee" className="h-10" loading="lazy" />
                </div>
              </div>
            </Link>
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-grow max-w-xl mx-8">
              <form onSubmit={handleSearch} className="flex w-full">
                <input type="text" placeholder="Search for products..." className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark transition-colors">
                  <SearchIcon size={20} />
                </button>
              </form>
            </div>
            {/* User Actions */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* User Account */}
              <Link to={isAuthenticated ? '/account' : '/login'} className="hidden md:flex items-center hover:text-primary">
                <UserIcon size={24} className="mr-1" />
                <div className="flex flex-col text-xs">
                  <span className="dark:text-gray-300">
                    {isAuthenticated ? `Hi, ${user?.name.split(' ')[0]}` : 'Login'}
                  </span>
                  <span className="font-semibold dark:text-white">
                    {isAuthenticated ? 'Account' : 'My Account'}
                  </span>
                </div>
              </Link>
              {/* Wishlist */}
              <Link to="/account/wishlist" className="hidden md:flex items-center hover:text-primary">
                <div className="relative">
                  <HeartIcon size={24} />
                  {wishlistItems.length > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>}
                </div>
                <div className="flex flex-col ml-1 text-xs">
                  <span className="dark:text-gray-300">Favorite</span>
                  <span className="font-semibold dark:text-white">
                    Wishlist
                  </span>
                </div>
              </Link>
              {/* Cart */}
              <Link to="/cart" className="flex items-center hover:text-primary">
                <div className="relative">
                  <ShoppingCartIcon size={24} />
                  {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>}
                </div>
                <div className="hidden md:flex flex-col ml-1 text-xs">
                  <span className="dark:text-gray-300">Your Cart</span>
                  <span className="font-semibold dark:text-white">
                    ${totalItems > 0 ? 0 .toFixed(2) : '0.00'}
                  </span>
                </div>
              </Link>
              {/* Mobile theme toggle */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>
              {/* Mobile menu button */}
              <button className="md:hidden p-1" onClick={onCategoriesClick}>
                <MenuIcon size={24} className="dark:text-white" />
              </button>
              {/* Mobile search button */}
              <button className="md:hidden p-1" onClick={onSearchClick}>
                <SearchIcon size={24} className="dark:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Header - Navigation */}
      <div className="hidden md:block bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex items-center justify-between">
            {/* Categories Dropdown */}
            <div className="group relative">
              <button className="flex items-center bg-primary text-white px-6 py-3 hover:bg-primary-dark transition-colors">
                <MenuIcon size={20} className="mr-2" />
                <span className="font-semibold">Browse All Categories</span>
                <ChevronDownIcon size={20} className="ml-2" />
              </button>
              <div className="absolute left-0 top-full hidden group-hover:block bg-white dark:bg-gray-900 shadow-lg rounded-b-md py-2 w-64 z-50">
                {categories.map((category, index) => <Link key={index} to={category.path} className="block px-4 py-2 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800 dark:text-gray-200 transition-colors">
                    {category.name}
                  </Link>)}
              </div>
            </div>
            {/* Main Navigation */}
            <nav className="flex-grow">
              <ul className="flex space-x-10">
                <li className="ml-8">
                  <Link to="/" className="block py-3 font-medium hover:text-primary transition-colors dark:text-gray-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="block py-3 font-medium hover:text-primary transition-colors dark:text-gray-200">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="block py-3 font-medium hover:text-primary transition-colors dark:text-gray-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="block py-3 font-medium hover:text-primary transition-colors dark:text-gray-200">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="block py-3 font-medium hover:text-primary transition-colors dark:text-gray-200">
                    Blog
                  </Link>
                </li>
              </ul>
            </nav>
            {/* Support Center */}
            <div className="flex items-center">
              <PhoneIcon size={20} className="mr-2 text-primary" />
              <div>
                <span className="block text-sm font-medium dark:text-gray-200">
                  1900100888
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Support Center
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>;
};