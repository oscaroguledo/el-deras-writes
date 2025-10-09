import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, FilterIcon, ChevronDownIcon, EyeIcon, PrinterIcon, DownloadIcon, MoreHorizontalIcon, CalendarIcon } from 'lucide-react';
export const AdminOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // Mock orders data
  const orders = [{
    id: 'ORD-1234',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    date: '2023-05-15',
    status: 'Delivered',
    paymentStatus: 'Paid',
    total: 78.95,
    items: 3
  }, {
    id: 'ORD-1235',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    date: '2023-05-14',
    status: 'Processing',
    paymentStatus: 'Paid',
    total: 124.5,
    items: 5
  }, {
    id: 'ORD-1236',
    customer: {
      name: 'Robert Johnson',
      email: 'robert@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    },
    date: '2023-05-14',
    status: 'Shipped',
    paymentStatus: 'Paid',
    total: 54.25,
    items: 2
  }, {
    id: 'ORD-1237',
    customer: {
      name: 'Emily Davis',
      email: 'emily@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
    },
    date: '2023-05-13',
    status: 'Delivered',
    paymentStatus: 'Paid',
    total: 92.3,
    items: 4
  }, {
    id: 'ORD-1238',
    customer: {
      name: 'Michael Brown',
      email: 'michael@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
    },
    date: '2023-05-12',
    status: 'Processing',
    paymentStatus: 'Pending',
    total: 45.75,
    items: 1
  }, {
    id: 'ORD-1239',
    customer: {
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
    },
    date: '2023-05-11',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    total: 67.2,
    items: 3
  }];
  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  // Status options for filter
  const statusOptions = [{
    value: 'all',
    label: 'All Statuses'
  }, {
    value: 'Processing',
    label: 'Processing'
  }, {
    value: 'Shipped',
    label: 'Shipped'
  }, {
    value: 'Delivered',
    label: 'Delivered'
  }, {
    value: 'Cancelled',
    label: 'Cancelled'
  }];
  return <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-main mb-2 md:mb-0">Orders</h1>
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
      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <input type="text" placeholder="Search orders by ID, customer name or email..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                {statusOptions.map(option => <option key={option.value} value={option.value}>
                    {option.label}
                  </option>)}
              </select>
              <ChevronDownIcon size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <FilterIcon size={18} className="mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>
      {/* Orders table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                <th className="py-3 px-4 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Payment</th>
                <th className="py-3 px-4 font-medium">Items</th>
                <th className="py-3 px-4 font-medium">Total</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <img src={order.customer.avatar} alt={order.customer.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                      <div>
                        <p className="font-medium text-main">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{order.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{order.items}</td>
                  <td className="py-3 px-4 font-medium">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link to={`/admin/orders/${order.id}`} className="p-1 text-gray-500 hover:text-primary" title="View">
                        <EyeIcon size={18} />
                      </Link>
                      <button className="p-1 text-gray-500 hover:text-main" title="Print">
                        <PrinterIcon size={18} />
                      </button>
                      <div className="relative group">
                        <button className="p-1 text-gray-500 hover:text-main">
                          <MoreHorizontalIcon size={18} />
                        </button>
                        <div className="absolute right-0 mt-1 hidden group-hover:block bg-white rounded-md shadow-lg border border-gray-200 z-10 w-36">
                          <div className="py-1">
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Update Status
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Send Invoice
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Cancel Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && <div className="py-12 text-center">
            <p className="text-gray-500">No orders found</p>
          </div>}
      </div>
      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">{filteredOrders.length}</span> of{' '}
          <span className="font-medium">{orders.length}</span> orders
        </p>
        <div className="flex items-center space-x-2">
          <button disabled className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-400 bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-primary text-white rounded-md text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>;
};