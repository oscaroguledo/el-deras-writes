import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, TruckIcon, BadgeCheckIcon, ShieldIcon, HeadphonesIcon } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { CategoryCard } from '../components/category/CategoryCard';
import { SkeletonProductCard } from '../components/skeletons/SkeletonProductCard';
// Mock data
const heroSlides = [{
  id: 1,
  title: 'Organic Products from Africa',
  subtitle: 'Farm Fresh & Natural',
  description: 'Experience the authentic taste of Africa with our premium organic products.',
  buttonText: 'Shop Now',
  buttonLink: '/products/featured',
  image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80'
}, {
  id: 2,
  title: 'Ethically Sourced Ingredients',
  subtitle: 'Pure & Natural',
  description: 'Supporting local farmers while bringing you the best quality African produce.',
  buttonText: 'Discover More',
  buttonLink: '/about',
  image: 'https://images.unsplash.com/photo-1595356161904-6708c97be89c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80'
}, {
  id: 3,
  title: 'Sustainable Packaging',
  subtitle: 'Eco-Friendly',
  description: 'Our commitment to the planet with biodegradable and recyclable packaging.',
  buttonText: 'Learn More',
  buttonLink: '/about',
  image: 'https://images.unsplash.com/photo-1509099652299-30938b0aeb63?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80'
}];
const categories = [{
  id: 1,
  name: 'Cereal Crops',
  image: 'https://images.unsplash.com/photo-1574323347407-f5e1c0cf4b7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 24,
  path: '/products/cereal-crops'
}, {
  id: 2,
  name: 'Legumes',
  image: 'https://images.unsplash.com/photo-1515543904379-3d757abe62ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 18,
  path: '/products/legumes'
}, {
  id: 3,
  name: 'Fruits & Vegetables',
  image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 32,
  path: '/products/fruits-vegetables'
}, {
  id: 4,
  name: 'Oilseeds',
  image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 15,
  path: '/products/oilseeds'
}, {
  id: 5,
  name: 'Spices and Herbs',
  image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 27,
  path: '/products/spices-herbs'
}, {
  id: 6,
  name: 'Nuts & Beverages',
  image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  count: 21,
  path: '/products/nuts-flowers-beverages'
}];
const featuredProducts = [{
  id: '1',
  name: 'Organic Shea Butter',
  price: 12.99,
  discountPrice: 9.99,
  rating: 4.8,
  reviewCount: 124,
  image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Oilseeds',
  isNew: true,
  isFeatured: true
}, {
  id: '2',
  name: 'Premium Arabica Coffee',
  price: 18.99,
  discountPrice: null,
  rating: 4.9,
  reviewCount: 86,
  image: 'https://images.unsplash.com/photo-1559525839-8f27c16df8d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Beverages',
  isNew: false,
  isFeatured: true
}, {
  id: '3',
  name: 'Organic Quinoa',
  price: 8.99,
  discountPrice: 6.99,
  rating: 4.7,
  reviewCount: 53,
  image: 'https://images.unsplash.com/photo-1612257999968-a42df8159183?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Cereal Crops',
  isNew: false,
  isFeatured: true
}, {
  id: '4',
  name: 'Moringa Powder',
  price: 15.99,
  discountPrice: null,
  rating: 4.6,
  reviewCount: 42,
  image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Herbs',
  isNew: true,
  isFeatured: true
}];
const popularProducts = [{
  id: '5',
  name: 'Organic Baobab Powder',
  price: 14.99,
  discountPrice: 11.99,
  rating: 4.7,
  reviewCount: 38,
  image: 'https://images.unsplash.com/photo-1611808786599-82da0b05969e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Superfoods',
  isNew: false,
  isFeatured: false
}, {
  id: '6',
  name: 'African Black Soap',
  price: 9.99,
  discountPrice: null,
  rating: 4.9,
  reviewCount: 112,
  image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Personal Care',
  isNew: false,
  isFeatured: false
}, {
  id: '7',
  name: 'Organic Hibiscus Tea',
  price: 7.99,
  discountPrice: 5.99,
  rating: 4.8,
  reviewCount: 76,
  image: 'https://images.unsplash.com/photo-1563911892437-1feda0179e1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Beverages',
  isNew: true,
  isFeatured: false
}, {
  id: '8',
  name: 'Raw Honey',
  price: 12.99,
  discountPrice: null,
  rating: 4.9,
  reviewCount: 94,
  image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Sweeteners',
  isNew: false,
  isFeatured: false
}];
const deals = [{
  id: '9',
  name: 'Organic Coconut Oil',
  price: 16.99,
  discountPrice: 12.99,
  discountPercent: 24,
  rating: 4.7,
  reviewCount: 63,
  image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Oilseeds',
  endsIn: '2d 15h 22m'
}, {
  id: '10',
  name: 'African Vanilla Beans',
  price: 24.99,
  discountPrice: 19.99,
  discountPercent: 20,
  rating: 4.8,
  reviewCount: 47,
  image: 'https://images.unsplash.com/photo-1611329695518-1763319ecd20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Spices',
  endsIn: '1d 8h 15m'
}];
export const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  // Simple carousel functionality to replace Swiper
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };
  return <div className="pb-16 md:pb-0">
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[60vh] md:h-[70vh] w-full">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img src={heroSlides[currentSlide].image} alt={heroSlides[currentSlide].title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-xl text-white">
              <motion.span className="inline-block px-4 py-1 bg-primary text-white rounded-full mb-4 text-sm font-medium" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.2
            }}>
                {heroSlides[currentSlide].subtitle}
              </motion.span>
              <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.4
            }}>
                {heroSlides[currentSlide].title}
              </motion.h1>
              <motion.p className="text-lg mb-6" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.6
            }}>
                {heroSlides[currentSlide].description}
              </motion.p>
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.8
            }}>
                <Link to={heroSlides[currentSlide].buttonLink} className="inline-flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md transition-colors">
                  {heroSlides[currentSlide].buttonText}
                  <ArrowRightIcon size={16} className="ml-2" />
                </Link>
              </motion.div>
            </div>
          </div>
          {/* Navigation buttons */}
          <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center">
            ❮
          </button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center">
            ❯
          </button>
          {/* Pagination dots */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center">
            {heroSlides.map((_, index) => <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full mx-1 ${currentSlide === index ? 'bg-white' : 'bg-white/50'}`} />)}
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <TruckIcon size={24} className="text-primary" />
              </div>
              <h3 className="font-medium text-main">Free Delivery</h3>
              <p className="text-sm text-gray-500">From $49.99</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BadgeCheckIcon size={24} className="text-primary" />
              </div>
              <h3 className="font-medium text-main">Certified Organic</h3>
              <p className="text-sm text-gray-500">100% Guarantee</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ShieldIcon size={24} className="text-primary" />
              </div>
              <h3 className="font-medium text-main">Secure Payments</h3>
              <p className="text-sm text-gray-500">100% Protected</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <HeadphonesIcon size={24} className="text-primary" />
              </div>
              <h3 className="font-medium text-main">24/7 Support</h3>
              <p className="text-sm text-gray-500">Dedicated Support</p>
            </div>
          </div>
        </div>
      </section>
      {/* Categories */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <span className="text-primary font-medium">
                Don't miss amazing grocery deals
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-main mt-1">
                Shop Categories
              </h2>
            </div>
            <Link to="/products" className="inline-flex items-center text-primary hover:underline mt-4 md:mt-0">
              All Categories
              <ArrowRightIcon size={16} className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map(category => <CategoryCard key={category.id} category={category} />)}
          </div>
        </div>
      </section>
      {/* Featured Products */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <span className="text-primary font-medium">Popular Products</span>
              <h2 className="text-2xl md:text-3xl font-bold text-main mt-1">
                Featured Cargoes
              </h2>
            </div>
            <Link to="/products/featured" className="inline-flex items-center text-primary hover:underline mt-4 md:mt-0">
              All Featured
              <ArrowRightIcon size={16} className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, index) => <SkeletonProductCard key={index} />) : featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
      {/* Deals of the day */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <span className="text-primary font-medium">Best deals</span>
              <h2 className="text-2xl md:text-3xl font-bold text-main mt-1">
                Top Deals of the Day
              </h2>
            </div>
            <Link to="/products/deals" className="inline-flex items-center text-primary hover:underline mt-4 md:mt-0">
              All Deals
              <ArrowRightIcon size={16} className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deals.map(deal => <div key={deal.id} className="flex flex-col md:flex-row bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="md:w-1/3">
                  <img src={deal.image} alt={deal.name} className="w-full h-60 md:h-full object-cover" />
                </div>
                <div className="flex-1 p-6">
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium mb-3">
                    Save {deal.discountPercent}%
                  </span>
                  <h3 className="text-xl font-semibold text-main mb-2">
                    {deal.name}
                  </h3>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(deal.rating))}
                      {'☆'.repeat(5 - Math.floor(deal.rating))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      ({deal.reviewCount})
                    </span>
                  </div>
                  <div className="flex items-center mb-4">
                    <span className="text-xl font-bold text-primary mr-2">
                      ${deal.discountPrice}
                    </span>
                    <span className="text-gray-500 line-through">
                      ${deal.price}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">
                      Hurry Up! Offer ends in:
                    </span>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-main font-medium">
                        {deal.endsIn}
                      </span>
                    </div>
                  </div>
                  <Link to={`/product/${deal.id}`} className="inline-flex items-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors">
                    Add to Cart
                  </Link>
                </div>
              </div>)}
          </div>
        </div>
      </section>
      {/* Popular Products */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <span className="text-primary font-medium">For you</span>
              <h2 className="text-2xl md:text-3xl font-bold text-main mt-1">
                Popular Products
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-full text-sm ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                All
              </button>
              <button onClick={() => setActiveTab('fruits')} className={`px-4 py-2 rounded-full text-sm ${activeTab === 'fruits' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                Fruits
              </button>
              <button onClick={() => setActiveTab('vegetables')} className={`px-4 py-2 rounded-full text-sm ${activeTab === 'vegetables' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                Vegetables
              </button>
              <button onClick={() => setActiveTab('spices')} className={`px-4 py-2 rounded-full text-sm ${activeTab === 'spices' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
                Spices
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, index) => <SkeletonProductCard key={index} />) : popularProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
      {/* Subscription Banner */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-primary/10 rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12">
                <span className="inline-block px-4 py-1 bg-primary text-white rounded-full mb-4 text-sm font-medium">
                  PERFECT GIFT FOR YOU
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-main mb-4">
                  Banwee Subscription
                </h2>
                <p className="text-gray-600 mb-6">
                  Delivered every month! Perfect for your favorite vegan or
                  anyone you want to introduce to the best better-for-you foods
                  out there.
                </p>
                <Link to="/subscription" className="inline-flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md transition-colors">
                  Subscribe Now
                  <ArrowRightIcon size={16} className="ml-2" />
                </Link>
              </div>
              <div className="md:w-1/2">
                <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80" alt="Subscription Box" className="w-full h-60 md:h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};