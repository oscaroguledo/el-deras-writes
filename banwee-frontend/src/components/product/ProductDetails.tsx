import React, { useState, Suspense, lazy, Component } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon, ShareIcon, ChevronRightIcon, MinusIcon, PlusIcon, CheckIcon, TruckIcon, ShieldIcon, RefreshCwIcon, ChevronLeftIcon, Facebook, Twitter, Instagram, Linkedin, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
const ProductCard = lazy(() => import('../product/ProductCard').then(module => ({
  default: module.ProductCard
})));
// Mock data for a single product
const product = {
  id: '1',
  name: 'Organic Shea Butter - Premium Grade A Raw Unrefined',
  price: 12.99,
  discountPrice: 9.99,
  rating: 4.8,
  reviewCount: 124,
  images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1626806787362-2c5ffe759acc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1626806787361-b64a8cbfa897?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1626806787359-ebc8e3c3f0b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'],
  category: 'Oilseeds',
  brand: 'Banwee Organics',
  sku: 'SB-12345',
  availability: 'In Stock',
  description: "Our premium organic shea butter is sourced directly from women's cooperatives in West Africa. This unrefined, Grade A shea butter is rich in vitamins A, E, and F, providing exceptional moisturizing properties for skin and hair. Each purchase supports fair trade practices and sustainable harvesting methods.",
  features: ['100% Pure & Natural', 'Ethically Sourced', 'Rich in Vitamins A, E & F', 'No additives or preservatives', 'Fair Trade Certified'],
  variants: [{
    id: '1-100',
    name: '100g',
    price: 9.99,
    discountPrice: null
  }, {
    id: '1-250',
    name: '250g',
    price: 19.99,
    discountPrice: 16.99
  }, {
    id: '1-500',
    name: '500g',
    price: 34.99,
    discountPrice: 29.99
  }],
  reviews: [{
    id: 1,
    user: 'Sarah M.',
    rating: 5,
    date: 'May 15, 2023',
    comment: "Absolutely love this shea butter! It's helped tremendously with my dry skin issues."
  }, {
    id: 2,
    user: 'Michael T.',
    rating: 4,
    date: 'April 22, 2023',
    comment: 'Great quality product. The texture is perfect and it absorbs well.'
  }, {
    id: 3,
    user: 'Jessica L.',
    rating: 5,
    date: 'March 10, 2023',
    comment: 'This is my third time purchasing. Works wonders for my eczema!'
  }]
};
// Mock data for related products
const relatedProducts = [{
  id: '2',
  name: 'African Black Soap',
  price: 9.99,
  discountPrice: null,
  rating: 4.9,
  reviewCount: 112,
  image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Personal Care'
}, {
  id: '3',
  name: 'Organic Coconut Oil',
  price: 16.99,
  discountPrice: 12.99,
  rating: 4.7,
  reviewCount: 63,
  image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Oilseeds'
}, {
  id: '4',
  name: 'Moringa Powder',
  price: 15.99,
  discountPrice: null,
  rating: 4.6,
  reviewCount: 42,
  image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Herbs'
}, {
  id: '5',
  name: 'Organic Baobab Powder',
  price: 14.99,
  discountPrice: 11.99,
  rating: 4.7,
  reviewCount: 38,
  image: 'https://images.unsplash.com/photo-1611808786599-82da0b05969e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
  category: 'Superfoods'
}];
const shareProduct = (platform: string, productUrl: string, productName: string) => {
  let shareUrl = '';
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedName = encodeURIComponent(productName);
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      break;
    case 'pinterest':
      shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedName}`;
      break;
  }
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
};
export const ProductDetails: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    addItem
  } = useCart();
  const {
    addItem: addToWishlist,
    isInWishlist
  } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };
  const handleAddToCart = () => {
    addItem({
      id: selectedVariant.id,
      name: `${product.name} - ${selectedVariant.name}`,
      price: selectedVariant.discountPrice || selectedVariant.price,
      quantity: quantity,
      image: product.images[0],
      variant: selectedVariant.name
    });
    // Show notification
    toast.success('Added to cart!', {
      description: `${product.name} - ${selectedVariant.name} has been added to your cart.`,
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart'
      }
    });
  };
  const handleAddToWishlist = () => {
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.images[0]
    });
    // Show notification
    if (!isWishlisted(product.id)) {
      toast.success('Added to wishlist!', {
        description: `${product.name} has been added to your wishlist.`,
        action: {
          label: 'View Wishlist',
          onClick: () => window.location.href = '/account/wishlist'
        }
      });
    } else {
      toast('Already in wishlist', {
        description: `${product.name} is already in your wishlist.`
      });
    }
  };
  const isWishlisted = isInWishlist(product.id);
  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };
  // Get the current product URL for sharing
  const productUrl = window.location.href;
  return <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm items-center">
        <Link to="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <Link to="/products" className="text-gray-500 hover:text-primary">
          Products
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <Link to={`/products/${product.category.toLowerCase()}`} className="text-gray-500 hover:text-primary">
          {product.category}
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <span className="text-main truncate max-w-xs">{product.name}</span>
      </nav>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="lg:w-1/2">
          <div className="mb-4 relative">
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img src={product.images[currentImageIndex]} alt={`${product.name} - Image ${currentImageIndex + 1}`} className="w-full h-96 object-cover" loading="lazy" />
            </div>
            {/* Navigation buttons */}
            <button onClick={prevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors">
              <ChevronLeftIcon size={20} />
            </button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors">
              <ChevronRightIcon size={20} />
            </button>
          </div>
          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => <button key={index} onClick={() => setCurrentImageIndex(index)} className={`cursor-pointer border-2 rounded-md overflow-hidden h-24 transition-all ${currentImageIndex === index ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                <img src={image} alt={`${product.name} - Thumbnail ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>)}
          </div>
        </div>
        {/* Product Info */}
        <div className="lg:w-1/2">
          <h1 className="text-2xl md:text-3xl font-bold text-main mb-2">
            {product.name}
          </h1>
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(product.rating))}
              {'☆'.repeat(5 - Math.floor(product.rating))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({product.reviewCount} reviews)
            </span>
          </div>
          <div className="mb-6">
            {selectedVariant.discountPrice ? <div className="flex items-center">
                <span className="text-2xl font-bold text-primary mr-2">
                  ${selectedVariant.discountPrice}
                </span>
                <span className="text-gray-500 line-through">
                  ${selectedVariant.price}
                </span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                  Save $
                  {(selectedVariant.price - selectedVariant.discountPrice).toFixed(2)}
                </span>
              </div> : <span className="text-2xl font-bold text-primary">
                ${selectedVariant.price}
              </span>}
          </div>
          <div className="mb-6">
            <p className="text-gray-600">{product.description}</p>
          </div>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="text-main font-medium mr-4">Size:</span>
              <div className="flex gap-2">
                {product.variants.map(variant => <button key={variant.id} onClick={() => setSelectedVariant(variant)} className={`px-3 py-1 border rounded-md ${selectedVariant.id === variant.id ? 'border-primary text-primary bg-primary/5' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                    {variant.name}
                  </button>)}
              </div>
            </div>
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center border border-gray-300 rounded-md mr-4">
              <button onClick={() => handleQuantityChange(quantity - 1)} className="px-3 py-2 text-gray-600 hover:text-primary" disabled={quantity <= 1}>
                <MinusIcon size={16} />
              </button>
              <input type="number" min="1" value={quantity} onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)} className="w-12 text-center border-none focus:outline-none" />
              <button onClick={() => handleQuantityChange(quantity + 1)} className="px-3 py-2 text-gray-600 hover:text-primary">
                <PlusIcon size={16} />
              </button>
            </div>
            <motion.button whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }} onClick={handleAddToCart} className="flex-grow bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-md transition-colors flex items-center justify-center">
              <ShoppingCartIcon size={18} className="mr-2" />
              Add to Cart
            </motion.button>
            <motion.button whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.9
          }} onClick={handleAddToWishlist} className={`ml-3 w-12 h-12 rounded-full flex items-center justify-center ${isWishlisted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <HeartIcon size={20} />
            </motion.button>
            <div className="relative ml-3">
              <motion.button whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.9
            }} onClick={() => setShareMenuOpen(!shareMenuOpen)} className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center">
                <ShareIcon size={20} />
              </motion.button>
              {shareMenuOpen && <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg p-2 z-10 border border-gray-200">
                  <div className="flex flex-col gap-2">
                    <button className="flex items-center p-2 hover:bg-gray-100 rounded-md" onClick={() => shareProduct('facebook', productUrl, product.name)}>
                      <Facebook size={18} className="mr-2 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button className="flex items-center p-2 hover:bg-gray-100 rounded-md" onClick={() => shareProduct('twitter', productUrl, product.name)}>
                      <Twitter size={18} className="mr-2 text-blue-400" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button className="flex items-center p-2 hover:bg-gray-100 rounded-md" onClick={() => shareProduct('linkedin', productUrl, product.name)}>
                      <Linkedin size={18} className="mr-2 text-blue-700" />
                      <span className="text-sm">LinkedIn</span>
                    </button>
                    <button className="flex items-center p-2 hover:bg-gray-100 rounded-md" onClick={() => shareProduct('pinterest', productUrl, product.name)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-red-600">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                      <span className="text-sm">Pinterest</span>
                    </button>
                  </div>
                </div>}
            </div>
          </div>
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                <CheckIcon size={14} className="text-green-600" />
              </div>
              <span className="text-sm">
                <span className="font-medium text-main">Availability:</span>{' '}
                {product.availability}
              </span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <TruckIcon size={14} className="text-blue-600" />
              </div>
              <span className="text-sm">
                <span className="font-medium text-main">Shipping:</span> Free
                shipping on orders over $49.99
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <RefreshCwIcon size={14} className="text-purple-600" />
              </div>
              <span className="text-sm">
                <span className="font-medium text-main">Returns:</span> 30-day
                return policy
              </span>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="text-sm">
                <span className="font-medium text-main">Brand:</span>{' '}
                {product.brand}
              </span>
            </div>
            <div className="flex items-center mb-2">
              <span className="text-sm">
                <span className="font-medium text-main">SKU:</span>{' '}
                {product.sku}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">
                <span className="font-medium text-main">Categories:</span>{' '}
                {product.category}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Product Tabs */}
      <div className="mt-12">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button onClick={() => setActiveTab('description')} className={`pb-4 px-1 ${activeTab === 'description' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}>
              Description
            </button>
            <button onClick={() => setActiveTab('features')} className={`pb-4 px-1 ${activeTab === 'features' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}>
              Features
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`pb-4 px-1 ${activeTab === 'reviews' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}>
              Reviews ({product.reviews.length})
            </button>
          </div>
        </div>
        <div className="py-6">
          {activeTab === 'description' && <div>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Our premium organic shea butter is harvested using traditional
                methods that have been passed down through generations. The nuts
                are collected, cleaned, and processed by hand to ensure the
                highest quality product.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                The butter is then carefully packaged to preserve its natural
                properties and shipped directly to our facilities where it
                undergoes rigorous quality testing before reaching your
                doorstep.
              </p>
            </div>}
          {activeTab === 'features' && <div>
              <h3 className="text-lg font-medium text-main mb-4">
                Key Features
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => <li key={index} className="flex items-start">
                    <CheckIcon size={18} className="text-primary mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>)}
              </ul>
              <h3 className="text-lg font-medium text-main mt-6 mb-4">
                How to Use
              </h3>
              <p className="text-gray-600 leading-relaxed">
                For skin: Apply a small amount to damp skin and massage gently
                until absorbed. Can be used daily on face and body.
              </p>
              <p className="text-gray-600 leading-relaxed mt-2">
                For hair: Warm a small amount between palms and apply to hair
                ends or use as a deep conditioning treatment.
              </p>
            </div>}
          {activeTab === 'reviews' && <div>
              <div className="mb-8">
                <h3 className="text-lg font-medium text-main mb-2">
                  Customer Reviews
                </h3>
                <div className="flex items-center">
                  <div className="flex text-yellow-400 mr-2">
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </div>
                  <span className="text-sm text-gray-500">
                    Based on {product.reviewCount} reviews
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                {product.reviews.map(review => <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400 mr-2">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                      <span className="font-medium text-main">
                        {review.user}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        - {review.date}
                      </span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>)}
              </div>
              <div className="mt-8">
                <Link to={`/product/${product.id}/reviews`} className="inline-flex items-center text-primary hover:underline">
                  See all reviews
                  <ChevronRightIcon size={16} className="ml-1" />
                </Link>
              </div>
            </div>}
        </div>
      </div>
      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-main mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Suspense fallback={<div className="col-span-4 h-48 flex items-center justify-center">
                Loading related products...
              </div>}>
            {relatedProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </Suspense>
        </div>
      </div>
    </div>;
};