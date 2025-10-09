import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon, SlidersHorizontalIcon, GridIcon, LayoutListIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
const ProductCard = lazy(() => import('../components/product/ProductCard').then(module => ({
  default: module.ProductCard
})));
// Loading placeholder
const ProductCardSkeleton = () => <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  </div>;
export const ProductList: React.FC = () => {
  const {
    category
  } = useParams<{
    category: string;
  }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Mock categories for filter
  const filterCategories = ['Cereal Crops', 'Legumes', 'Fruits & Vegetables', 'Oilseeds', 'Fibers', 'Spices and Herbs', 'Meat & Fish', 'Nuts & Flowers'];
  // Mock brands for filter
  const filterBrands = ['Banwee Organics', 'Pure African', 'Savannah Harvest', "Nature's Gift", 'Green Earth', 'Organic Life'];
  // Mock products data
  const products = [{
    id: '1',
    name: 'Organic Shea Butter',
    price: 12.99,
    discountPrice: 9.99,
    rating: 4.8,
    reviewCount: 124,
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Oilseeds'
  }, {
    id: '2',
    name: 'African Black Soap',
    price: 9.99,
    discountPrice: null,
    rating: 4.9,
    reviewCount: 112,
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Personal Care'
  }, {
    id: '3',
    name: 'Organic Coconut Oil',
    price: 16.99,
    discountPrice: 12.99,
    rating: 4.7,
    reviewCount: 63,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Oilseeds'
  }, {
    id: '4',
    name: 'Moringa Powder',
    price: 15.99,
    discountPrice: null,
    rating: 4.6,
    reviewCount: 42,
    image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Herbs'
  }, {
    id: '5',
    name: 'Organic Baobab Powder',
    price: 14.99,
    discountPrice: 11.99,
    rating: 4.7,
    reviewCount: 38,
    image: 'https://images.unsplash.com/photo-1611808786599-82da0b05969e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Superfoods'
  }, {
    id: '6',
    name: 'Raw Honey',
    price: 18.99,
    discountPrice: 15.99,
    rating: 4.9,
    reviewCount: 87,
    image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Sweeteners'
  }, {
    id: '7',
    name: 'Organic Cocoa Butter',
    price: 13.99,
    discountPrice: null,
    rating: 4.6,
    reviewCount: 29,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Oilseeds'
  }, {
    id: '8',
    name: 'Organic Hibiscus Tea',
    price: 8.99,
    discountPrice: 6.99,
    rating: 4.8,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1563911892437-1feda0179e1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    category: 'Beverages'
  }];
  // Filter products based on category or search query
  const filteredProducts = products.filter(product => {
    if (category && category !== 'search') {
      const categorySlug = category.toLowerCase().replace(/-/g, ' ');
      return product.category.toLowerCase() === categorySlug;
    }
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });
  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [category, searchQuery]);
  // Get the display name for the current category
  const getCategoryDisplayName = () => {
    if (category && category !== 'search') {
      return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    return 'All Products';
  };
  return <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-primary dark:text-gray-400">
          Home
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <Link to="/products" className="text-gray-500 hover:text-primary dark:text-gray-400">
          Products
        </Link>
        {category && category !== 'search' && <>
            <ChevronRightIcon size={16} className="mx-2" />
            <span className="text-main dark:text-white">
              {getCategoryDisplayName()}
            </span>
          </>}
        {searchQuery && <>
            <ChevronRightIcon size={16} className="mx-2" />
            <span className="text-main dark:text-white">Search</span>
          </>}
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-main dark:text-white mb-2">
            {getCategoryDisplayName()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {filteredProducts.length} products found
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          {/* View Mode Switcher */}
          <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 rounded-md p-1 mr-4">
            <button className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setViewMode('grid')} aria-label="Grid view">
              <GridIcon size={18} />
            </button>
            <button className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setViewMode('list')} aria-label="List view">
              <LayoutListIcon size={18} />
            </button>
          </div>
          {/* Sort Dropdown */}
          <div className="relative mr-4">
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDownIcon size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          {/* Filter Button (Mobile) */}
          <button className="bg-primary text-white px-4 py-2 rounded-md flex items-center" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontalIcon size={18} className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-64 flex-shrink-0 pr-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-6 sticky top-20">
            <h2 className="font-semibold text-lg text-main dark:text-white mb-4">
              Filters
            </h2>
            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium text-main dark:text-white mb-3">
                Price Range
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300">
                  ${priceRange[0]}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  ${priceRange[1]}
                </span>
              </div>
              <input type="range" min="0" max="100" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-md appearance-none cursor-pointer" />
            </div>
            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium text-main dark:text-white mb-3">
                Categories
              </h3>
              <div className="space-y-2">
                {filterCategories.map((cat, index) => <div key={index} className="flex items-center">
                    <input type="checkbox" id={`cat-${index}`} className="mr-2" checked={selectedCategories.includes(cat)} onChange={() => {
                  if (selectedCategories.includes(cat)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== cat));
                  } else {
                    setSelectedCategories([...selectedCategories, cat]);
                  }
                }} />
                    <label htmlFor={`cat-${index}`} className="text-gray-600 dark:text-gray-300">
                      {cat}
                    </label>
                  </div>)}
              </div>
            </div>
            {/* Brands */}
            <div className="mb-6">
              <h3 className="font-medium text-main dark:text-white mb-3">
                Brands
              </h3>
              <div className="space-y-2">
                {filterBrands.map((brand, index) => <div key={index} className="flex items-center">
                    <input type="checkbox" id={`brand-${index}`} className="mr-2" checked={selectedBrands.includes(brand)} onChange={() => {
                  if (selectedBrands.includes(brand)) {
                    setSelectedBrands(selectedBrands.filter(b => b !== brand));
                  } else {
                    setSelectedBrands([...selectedBrands, brand]);
                  }
                }} />
                    <label htmlFor={`brand-${index}`} className="text-gray-600 dark:text-gray-300">
                      {brand}
                    </label>
                  </div>)}
              </div>
            </div>
            {/* Rating */}
            <div>
              <h3 className="font-medium text-main dark:text-white mb-3">
                Rating
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => <div key={rating} className="flex items-center">
                    <input type="checkbox" id={`rating-${rating}`} className="mr-2" />
                    <label htmlFor={`rating-${rating}`} className="flex items-center text-gray-600 dark:text-gray-300">
                      <div className="flex text-yellow-400 mr-1">
                        {'★'.repeat(rating)}
                        {'☆'.repeat(5 - rating)}
                      </div>
                      {rating === 5 ? '& up' : ''}
                    </label>
                  </div>)}
              </div>
            </div>
            {/* Reset Filters Button */}
            <button className="mt-6 text-primary hover:underline text-sm">
              Reset all filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-grow">
          {loading ? <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6' : 'space-y-4'}>
              {[...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)}
            </div> : filteredProducts.length > 0 ? <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6' : 'space-y-4'}>
              <Suspense fallback={<ProductCardSkeleton />}>
                {filteredProducts.map(product => <ProductCard key={product.id} product={product} viewMode={viewMode} />)}
              </Suspense>
            </div> : <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-xl font-semibold text-main dark:text-white mb-2">
                No products found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't find any products matching your criteria.
              </p>
              <button onClick={() => {
            setSelectedCategories([]);
            setSelectedBrands([]);
            setPriceRange([0, 100]);
          }} className="text-primary hover:underline">
                Reset all filters
              </button>
            </div>}
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {filterOpen && <motion.div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <motion.div className="absolute right-0 top-0 h-full w-4/5 max-w-md bg-white dark:bg-gray-900 overflow-y-auto" initial={{
        x: '100%'
      }} animate={{
        x: 0
      }} exit={{
        x: '100%'
      }} transition={{
        type: 'tween'
      }}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-lg text-main dark:text-white">
                Filters
              </h2>
              <button onClick={() => setFilterOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <XIcon size={24} />
              </button>
            </div>
            <div className="p-4">
              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-main dark:text-white mb-3">
                  Price Range
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">
                    ${priceRange[0]}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    ${priceRange[1]}
                  </span>
                </div>
                <input type="range" min="0" max="100" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-md appearance-none cursor-pointer" />
              </div>
              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-main dark:text-white mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  {filterCategories.map((cat, index) => <div key={index} className="flex items-center">
                      <input type="checkbox" id={`mobile-cat-${index}`} className="mr-2" checked={selectedCategories.includes(cat)} onChange={() => {
                  if (selectedCategories.includes(cat)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== cat));
                  } else {
                    setSelectedCategories([...selectedCategories, cat]);
                  }
                }} />
                      <label htmlFor={`mobile-cat-${index}`} className="text-gray-600 dark:text-gray-300">
                        {cat}
                      </label>
                    </div>)}
                </div>
              </div>
              {/* Apply Filters Button */}
              <div className="mt-6 flex space-x-4">
                <button className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 rounded-md" onClick={() => {
              setSelectedCategories([]);
              setSelectedBrands([]);
              setPriceRange([0, 100]);
            }}>
                  Reset
                </button>
                <button className="flex-1 bg-primary text-white py-2 rounded-md" onClick={() => setFilterOpen(false)}>
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>}
    </div>;
};
export default ProductList;