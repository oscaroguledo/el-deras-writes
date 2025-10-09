import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, TrashIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';
export const Cart: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    clearCart
  } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const handleQuantityChange = (id: string, quantity: number, variant?: string) => {
    if (quantity >= 1) {
      updateQuantity(id, quantity, variant);
    }
  };
  const handleRemoveItem = (id: string, variant?: string) => {
    removeItem(id, variant);
  };
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock coupon application logic
    alert(`Coupon ${couponCode} applied!`);
  };
  // Calculate order summary
  const subtotal = totalPrice;
  const shipping = subtotal > 49.99 ? 0 : 5.99;
  const tax = subtotal * 0.07;
  const total = subtotal + shipping + tax;
  return <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <ChevronRightIcon size={16} className="mx-2" />
        <span className="text-main">Shopping Cart</span>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold text-main mb-6">
        Your Shopping Cart
      </h1>
      {items.length === 0 ? <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingCartIcon size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-main mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link to="/products" className="inline-flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md transition-colors">
            Continue Shopping
          </Link>
        </div> : <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 text-main font-medium">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Subtotal</div>
              </div>
              <div className="divide-y divide-gray-200">
                {items.map(item => <div key={`${item.id}-${item.variant || ''}`} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 flex items-center">
                        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="ml-4">
                          <Link to={`/product/${item.id}`} className="font-medium text-main hover:text-primary">
                            {item.name}
                          </Link>
                          {item.variant && <p className="text-sm text-gray-500">
                              Size: {item.variant}
                            </p>}
                          <button onClick={() => handleRemoveItem(item.id, item.variant)} className="text-sm text-red-500 hover:text-red-600 flex items-center mt-1">
                            <TrashIcon size={14} className="mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="md:hidden font-medium text-main">
                          Price:{' '}
                        </span>
                        <span className="font-medium text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.variant)} className="px-2 py-1 text-gray-600 hover:text-primary" disabled={item.quantity <= 1}>
                            <MinusIcon size={14} />
                          </button>
                          <input type="number" min="1" value={item.quantity} onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 1, item.variant)} className="w-10 text-center border-none focus:outline-none" />
                          <button onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.variant)} className="px-2 py-1 text-gray-600 hover:text-primary">
                            <PlusIcon size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="md:hidden font-medium text-main">
                          Subtotal:{' '}
                        </span>
                        <span className="font-medium text-main">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center">
                  <button onClick={() => clearCart()} className="text-sm text-red-500 hover:text-red-600 flex items-center">
                    <TrashIcon size={14} className="mr-1" />
                    Clear Cart
                  </button>
                </div>
                <Link to="/products" className="text-sm text-primary hover:underline flex items-center">
                  Continue Shopping
                  <ChevronRightIcon size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-main mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-main">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-main">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-main">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-main">Total</span>
                  <span className="text-lg font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
              <form onSubmit={handleApplyCoupon} className="mb-6">
                <div className="flex">
                  <input type="text" placeholder="Coupon code" className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark transition-colors">
                    Apply
                  </button>
                </div>
              </form>
              <motion.div whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }}>
                <Link to="/checkout" className="block w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-md transition-colors text-center font-medium">
                  Proceed to Checkout
                </Link>
              </motion.div>
            </div>
          </div>
        </div>}
    </div>;
};