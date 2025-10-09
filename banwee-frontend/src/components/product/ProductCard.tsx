import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon, EyeIcon } from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
}
interface ProductCardProps {
  product: Product;
  className?: string;
}
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className
}) => {
  const {
    addItem
  } = useCart();
  const {
    addItem: addToWishlist,
    isInWishlist
  } = useWishlist();
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity: 1,
      image: product.image
    });
  };
  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.image
    });
  };
  const isWishlisted = isInWishlist(product.id);
  return <motion.div className={cn('bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-shadow hover:shadow-md group', className)} whileHover={{
    y: -5
  }} transition={{
    duration: 0.2
  }}>
      <div className="relative">
        <Link to={`/product/${product.id}`}>
          <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        </Link>
        {/* Product badges */}
        {product.isNew && <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            New
          </span>}
        {product.discountPrice && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Sale
          </span>}
        {/* Quick action buttons */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20">
          <div className="flex space-x-2">
            <button onClick={handleAddToCart} className="w-9 h-9 rounded-full bg-white text-main flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Add to cart">
              <ShoppingCartIcon size={16} />
            </button>
            <button onClick={handleAddToWishlist} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-main hover:bg-primary hover:text-white'}`} aria-label="Add to wishlist">
              <HeartIcon size={16} />
            </button>
            <Link to={`/product/${product.id}`} className="w-9 h-9 rounded-full bg-white text-main flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="View product">
              <EyeIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4">
        <span className="text-xs text-gray-500">{product.category}</span>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-main hover:text-primary transition-colors mb-1 line-clamp-2 h-12">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-xs">
            {'★'.repeat(Math.floor(product.rating))}
            {'☆'.repeat(5 - Math.floor(product.rating))}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {product.discountPrice ? <div className="flex items-center">
                <span className="font-bold text-primary mr-2">
                  ${product.discountPrice}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  ${product.price}
                </span>
              </div> : <span className="font-bold text-primary">${product.price}</span>}
          </div>
          <button onClick={handleAddToCart} className="text-gray-400 hover:text-primary transition-colors p-1" aria-label="Add to cart">
            <ShoppingCartIcon size={18} />
          </button>
        </div>
      </div>
    </motion.div>;
};