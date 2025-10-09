import React, { useState } from 'react';
import { BarChart3Icon, TrendingUpIcon, UsersIcon, ShoppingCartIcon, DollarSignIcon, CalendarIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, PackageIcon } from 'lucide-react';
export const AdminAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  // Mock analytics data
  const overviewStats = [{
    title: 'Total Revenue',
    value: '$12,628',
    previousValue: '$10,892',
    change: '+15.9%',
    increasing: true,
    icon: <DollarSignIcon size={20} />,
    color: 'bg-blue-500'
  }, {
    title: 'Orders',
    value: '356',
    previousValue: '324',
    change: '+9.9%',
    increasing: true,
    icon: <ShoppingCartIcon size={20} />,
    color: 'bg-green-500'
  }, {
    title: 'Customers',
    value: '2,420',
    previousValue: '2,150',
    change: '+12.6%',
    increasing: true,
    icon: <UsersIcon size={20} />,
    color: 'bg-purple-500'
  }, {
    title: 'Conversion Rate',
    value: '3.42%',
    previousValue: '3.60%',
    change: '-5.0%',
    increasing: false,
    icon: <TrendingUpIcon size={20} />,
    color: 'bg-orange-500'
  }];
  const topSellingProducts = [{
    id: '1',
    name: 'Organic Shea Butter',
    sales: 142,
    revenue: 1419.58,
    growth: '+12.5%',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '2',
    name: 'Premium Arabica Coffee',
    sales: 98,
    revenue: 1861.02,
    growth: '+8.2%',
    image: 'https://images.unsplash.com/photo-1559525839-8f27c16df8d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '3',
    name: 'Organic Quinoa',
    sales: 76,
    revenue: 532.24,
    growth: '+5.7%',
    image: 'https://images.unsplash.com/photo-1612257999968-a42df8159183?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }, {
    id: '4',
    name: 'Moringa Powder',
    sales: 65,
    revenue: 1039.35,
    growth: '-2.3%',
    image: 'https://images.unsplash.com/photo-1515362655824-9a74989f318e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80'
  }];
  const salesByCategory = [{
    category: 'Oilseeds',
    percentage: 28,
    value: 3528.42,
    color: 'bg-blue-500'
  }, {
    category: 'Beverages',
    percentage: 22,
    value: 2778.16,
    color: 'bg-green-500'
  }, {
    category: 'Cereal Crops',
    percentage: 18,
    value: 2273.04,
    color: 'bg-yellow-500'
  }, {
    category: 'Spices and Herbs',
    percentage: 15,
    value: 1894.2,
    color: 'bg-purple-500'
  }, {
    category: 'Others',
    percentage: 17,
    value: 2146.76,
    color: 'bg-gray-400'
  }];
  return <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-main mb-2 md:mb-0">Analytics</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-white border border-gray-300 rounded-md overflow-hidden flex">
            <button className={`px-3 py-1.5 text-sm ${timeRange === '7d' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`} onClick={() => setTimeRange('7d')}>
              7D
            </button>
            <button className={`px-3 py-1.5 text-sm ${timeRange === '30d' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`} onClick={() => setTimeRange('30d')}>
              30D
            </button>
            <button className={`px-3 py-1.5 text-sm ${timeRange === '3m' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`} onClick={() => setTimeRange('3m')}>
              3M
            </button>
            <button className={`px-3 py-1.5 text-sm ${timeRange === '12m' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`} onClick={() => setTimeRange('12m')}>
              12M
            </button>
          </div>
          <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm">
            <CalendarIcon size={16} className="mr-2" />
            Custom
          </button>
          <button className="px-3 py-1.5 bg-primary text-white rounded-md text-sm">
            Export
          </button>
        </div>
      </div>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewStats.map((stat, index) => <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
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
            <div className="text-2xl font-bold text-main mb-2">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">
              vs. {stat.previousValue} previous period
            </div>
          </div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">
              Revenue Overview
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm">
                Revenue
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                Orders
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
            <div className="text-center">
              <BarChart3Icon size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Revenue chart visualization</p>
              <p className="text-sm text-gray-400">
                (This would be an actual chart in a real implementation)
              </p>
            </div>
          </div>
        </div>
        {/* Sales by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">
              Sales by Category
            </h2>
          </div>
          <div className="space-y-4">
            {salesByCategory.map((category, index) => <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    {category.category}
                  </span>
                  <span className="text-sm font-medium text-main">
                    {category.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${category.color}`} style={{
                width: `${category.percentage}%`
              }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ${category.value.toFixed(2)}
                </div>
              </div>)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">
              Top Selling Products
            </h2>
            <button className="text-primary hover:underline text-sm flex items-center">
              View All <ArrowRightIcon size={16} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {topSellingProducts.map(product => <div key={product.id} className="flex items-center">
                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                <div className="flex-grow">
                  <h3 className="font-medium text-main text-sm">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {product.sales} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-main">
                    ${product.revenue.toFixed(2)}
                  </p>
                  <p className={`text-xs ${product.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {product.growth}
                  </p>
                </div>
              </div>)}
          </div>
        </div>
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-main">Recent Activity</h2>
            <button className="text-primary hover:underline text-sm flex items-center">
              View All <ArrowRightIcon size={16} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                <ShoppingCartIcon size={16} />
              </div>
              <div>
                <p className="text-sm text-main">
                  <span className="font-medium">New order</span> from Jane Smith
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                <UsersIcon size={16} />
              </div>
              <div>
                <p className="text-sm text-main">
                  <span className="font-medium">New customer</span> registered
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 flex-shrink-0">
                <PackageIcon size={16} />
              </div>
              <div>
                <p className="text-sm text-main">
                  <span className="font-medium">Product update:</span> Moringa
                  Powder is low in stock
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                <DollarSignIcon size={16} />
              </div>
              <div>
                <p className="text-sm text-main">
                  <span className="font-medium">Payment received</span> for
                  order #ORD-1234
                </p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};