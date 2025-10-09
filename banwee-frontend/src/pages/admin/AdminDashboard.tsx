import React from 'react';
import { BarChart3Icon, ShoppingCartIcon, UsersIcon, DollarSignIcon, ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, CalendarIcon, PackageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export const AdminDashboard: React.FC = () => {
  // Mock data for dashboard
  const stats = [{
    title: 'Total Revenue',
    value: '$12,628',
    change: '+12.5%',
    increasing: true,
    icon: <DollarSignIcon size={20} />,
    color: 'bg-blue-500'
  }, {
    title: 'Orders',
    value: '356',
    change: '+8.2%',
    increasing: true,
    icon: <ShoppingCartIcon size={20} />,
    color: 'bg-green-500'
  }, {
    title: 'Customers',
    value: '2,420',
    change: '+5.7%',
    increasing: true,
    icon: <UsersIcon size={20} />,
    color: 'bg-purple-500'
  }, {
    title: 'Conversion Rate',
    value: '3.42%',
    change: '-0.5%',
    increasing: false,
    icon: <TrendingUpIcon size={20} />,
    color: 'bg-orange-500'
  }];
  const recentOrders = [{
    id: 'ORD-1234',
    customer: 'John Doe',
    date: '2023-05-15',
    status: 'Delivered',
    total: 78.95
  }, {
    id: 'ORD-1235',
    customer: 'Jane Smith',
    date: '2023-05-14',
    status: 'Processing',
    total: 124.5
  }, {
    id: 'ORD-1236',
    customer: 'Robert Johnson',
    date: '2023-05-14',
    status: 'Shipped',
    total: 54.25
  }, {
    id: 'ORD-1237',
    customer: 'Emily Davis',
    date: '2023-05-13',
    status: 'Delivered',
    total: 92.3
  }, {
    id: 'ORD-1238',
    customer: 'Michael Brown',
    date: '2023-05-12',
    status: 'Processing',
    total: 45.75
  }];
  const topProducts = [{
    id: '1',
    name: 'Organic Shea Butter',
    sales: 142,
    revenue: 1419.58,
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '2',
    name: 'Premium Arabica Coffee',
    sales: 98,
    revenue: 1861.02,
    image: 'https://images.unsplash.com/photo-1559525839-8f27c16df8d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '3',
    name: 'Organic Quinoa',
    sales: 76,
    revenue: 532.24,
    image: 'https://images.unsplash.com/photo-1612257999968-a42df8159183?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '4',
    name: 'Moringa Powder',
    sales: 65,
    revenue: 1039.35,
    image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }];
  return <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-main mb-2 md:mb-0">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm">
            <CalendarIcon size={16} className="mr-2" />
            Last 30 Days
          </button>
          <button className="px-3 py-1.5 bg-primary text-white rounded-md text-sm">
            Export
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.color} text-white flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className={`flex items-center text-sm ${stat.increasing ? 'text-green-600' : 'text-red-600'}`}>
                {stat.increasing ? <ArrowUpIcon size={16} className="mr-1" /> : <ArrowDownIcon size={16} className="mr-1" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">{stat.title}</h3>
            <div className="text-2xl font-bold text-main">{stat.value}</div>
          </div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 border-b text-sm">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 text-main">
                      <Link to={`/admin/orders/${order.id}`} className="hover:text-primary">
                        {order.id}
                      </Link>
                    </td>
                    <td className="py-3 text-main">{order.customer}</td>
                    <td className="py-3 text-gray-500">{order.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      ${order.total.toFixed(2)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">Top Products</h2>
            <Link to="/admin/products" className="text-primary hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map(product => <div key={product.id} className="flex items-center">
                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                <div className="flex-grow">
                  <h3 className="font-medium text-main text-sm">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-xs">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-main">
                    ${product.revenue.toFixed(2)}
                  </p>
                </div>
              </div>)}
          </div>
        </div>
      </div>
      {/* Analytics Summary */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-main">Sales Overview</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm">
              Weekly
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
              Monthly
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
              Yearly
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
          <div className="text-center">
            <BarChart3Icon size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Sales chart visualization</p>
            <p className="text-sm text-gray-400">
              (This would be an actual chart in a real implementation)
            </p>
          </div>
        </div>
      </div>
    </div>;
};