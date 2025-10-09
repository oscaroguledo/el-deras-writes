import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, DownloadIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
}
export const Orders: React.FC = () => {
  // Mock orders data
  const mockOrders: Order[] = [{
    id: 'ORD123456',
    date: '2023-09-15',
    status: 'Delivered',
    total: 129.99,
    items: [{
      id: 'prod1',
      name: 'Wireless Headphones',
      price: 79.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
    }, {
      id: 'prod2',
      name: 'USB-C Cable',
      price: 12.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&h=300&fit=crop'
    }]
  }, {
    id: 'ORD123455',
    date: '2023-09-10',
    status: 'Shipped',
    total: 79.5,
    items: [{
      id: 'prod3',
      name: 'Smart Watch',
      price: 79.5,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop'
    }]
  }, {
    id: 'ORD123454',
    date: '2023-08-28',
    status: 'Processing',
    total: 49.99,
    items: [{
      id: 'prod4',
      name: 'Bluetooth Speaker',
      price: 49.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop'
    }]
  }];
  const [orders] = useState<Order[]>(mockOrders);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  return <div>
      <h1 className="text-2xl font-bold text-main dark:text-white mb-6">
        My Orders
      </h1>
      {orders.length > 0 ? <div className="space-y-4">
          {orders.map(order => <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750" onClick={() => toggleOrderExpand(order.id)}>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order placed
                  </p>
                  <p className="font-medium text-main dark:text-white">
                    {order.date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order ID
                  </p>
                  <p className="font-medium text-main dark:text-white">
                    {order.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                  <p className="font-medium text-main dark:text-white">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                {expandedOrderId === order.id ? <ChevronUpIcon size={20} className="text-gray-500" /> : <ChevronDownIcon size={20} className="text-gray-500" />}
              </div>
              {expandedOrderId === order.id && <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    {order.items.map(item => <div key={item.id} className="flex items-center space-x-4">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h3 className="font-medium text-main dark:text-white">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-main dark:text-white">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>)}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-500 dark:text-gray-400">
                        Subtotal: ${order.total.toFixed(2)}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Shipping: Free
                      </p>
                      <p className="font-medium text-main dark:text-white">
                        Total: ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/account/orders/${order.id}`} className="flex items-center px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        <EyeIcon size={16} className="mr-1" />
                        View details
                      </Link>
                      <button className="flex items-center px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        <DownloadIcon size={16} className="mr-1" />
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>}
            </div>)}
        </div> : <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ShoppingBagIcon size={24} className="text-gray-500 dark:text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-main dark:text-white mb-2">
            No orders yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link to="/products" className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md">
            Start Shopping
          </Link>
        </div>}
    </div>;
};
import { ShoppingBagIcon } from 'lucide-react';
export default Orders;