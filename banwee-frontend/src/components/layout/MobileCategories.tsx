import React from 'react';
import { Link } from 'react-router-dom';
import { XIcon, ChevronRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface MobileCategoriesProps {
  isOpen: boolean;
  onClose: () => void;
}
export const MobileCategories: React.FC<MobileCategoriesProps> = ({
  isOpen,
  onClose
}) => {
  // Categories
  const categories = [{
    name: 'Cereal Crops',
    path: '/products/cereal-crops',
    icon: '🌾'
  }, {
    name: 'Brands',
    path: '/products/brands',
    icon: '🏷️'
  }, {
    name: 'Legumes',
    path: '/products/legumes',
    icon: '🥜'
  }, {
    name: 'Fruits & Vegetables',
    path: '/products/fruits-vegetables',
    icon: '🍎'
  }, {
    name: 'Oilseeds',
    path: '/products/oilseeds',
    icon: '🌱'
  }, {
    name: 'Fibers',
    path: '/products/fibers',
    icon: '🧶'
  }, {
    name: 'Spices and Herbs',
    path: '/products/spices-herbs',
    icon: '🌿'
  }, {
    name: 'Meat, Fish & Sweeteners',
    path: '/products/meat-fish-sweeteners',
    icon: '🥩'
  }, {
    name: 'Nuts, Flowers & Beverages',
    path: '/products/nuts-flowers-beverages',
    icon: '🥥'
  }];
  // Main navigation
  const mainNavigation = [{
    name: 'Home',
    path: '/'
  }, {
    name: 'About',
    path: '/about'
  }, {
    name: 'Contact',
    path: '/contact'
  }, {
    name: 'FAQ',
    path: '/faq'
  }, {
    name: 'Blog',
    path: '/blog'
  }];
  return <AnimatePresence>
      {isOpen && <motion.div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.2
    }}>
          <motion.div className="bg-white w-4/5 max-w-sm h-full overflow-y-auto" initial={{
        x: '-100%'
      }} animate={{
        x: 0
      }} exit={{
        x: '-100%'
      }} transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-main">Categories</h3>
                <button onClick={onClose} className="p-1">
                  <XIcon size={24} />
                </button>
              </div>
            </div>
            {/* User Actions */}
            <div className="p-4 border-b border-gray-200">
              <Link to="/login" className="flex items-center justify-between py-2 px-3 bg-primary text-white rounded-md mb-2" onClick={onClose}>
                <span>Sign In / Register</span>
                <ChevronRightIcon size={20} />
              </Link>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link to="/account/orders" className="py-2 px-3 bg-gray-100 rounded-md text-center text-sm" onClick={onClose}>
                  My Orders
                </Link>
                <Link to="/account/wishlist" className="py-2 px-3 bg-gray-100 rounded-md text-center text-sm" onClick={onClose}>
                  Wishlist
                </Link>
              </div>
            </div>
            {/* Categories */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Shop By Category
              </h4>
              <ul>
                {categories.map((category, index) => <li key={index}>
                    <Link to={category.path} className="flex items-center py-3 hover:text-primary" onClick={onClose}>
                      <span className="mr-3 text-xl">{category.icon}</span>
                      <span>{category.name}</span>
                    </Link>
                  </li>)}
              </ul>
            </div>
            {/* Main Navigation */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Menu</h4>
              <ul>
                {mainNavigation.map((item, index) => <li key={index}>
                    <Link to={item.path} className="flex items-center py-3 hover:text-primary border-b border-gray-100 last:border-0" onClick={onClose}>
                      <span>{item.name}</span>
                    </Link>
                  </li>)}
              </ul>
            </div>
            {/* Help */}
            <div className="p-4 bg-gray-50 mt-auto">
              <div className="flex items-center">
                <span className="text-primary mr-2">📞</span>
                <div>
                  <span className="block text-sm font-medium">1900100888</span>
                  <span className="block text-xs text-gray-500">
                    Support Center
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Backdrop to close menu */}
          <div className="flex-grow" onClick={onClose}></div>
        </motion.div>}
    </AnimatePresence>;
};