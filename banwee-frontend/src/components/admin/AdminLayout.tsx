import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboardIcon, UsersIcon, PackageIcon, ShoppingCartIcon, BarChart3Icon, SettingsIcon, BellIcon, SearchIcon, MenuIcon, XIcon, LogOutIcon, TagIcon, MessageSquareIcon, GlobeIcon } from 'lucide-react';
interface AdminLayoutProps {
  children: React.ReactNode;
}
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([{
    id: 1,
    message: 'New order #12345 has been placed',
    time: '5 minutes ago',
    read: false
  }, {
    id: 2,
    message: 'Product "Organic Shea Butter" is low in stock',
    time: '2 hours ago',
    read: false
  }, {
    id: 3,
    message: 'Customer feedback received for order #12340',
    time: 'Yesterday',
    read: true
  }]);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  // Check if user is admin, if not redirect to home
  useEffect(() => {
    if (!user || user.email !== 'admin@example.com' && user.email !== 'admin@banwee.com') {
      navigate('/');
    }
  }, [user, navigate]);
  const menuItems = [{
    title: 'Dashboard',
    path: '/admin',
    icon: <LayoutDashboardIcon size={20} />
  }, {
    title: 'Analytics',
    path: '/admin/analytics',
    icon: <BarChart3Icon size={20} />
  }, {
    title: 'Orders',
    path: '/admin/orders',
    icon: <ShoppingCartIcon size={20} />
  }, {
    title: 'Products',
    path: '/admin/products',
    icon: <PackageIcon size={20} />
  }, {
    title: 'Variants',
    path: '/admin/variants',
    icon: <TagIcon size={20} />
  }, {
    title: 'Users',
    path: '/admin/users',
    icon: <UsersIcon size={20} />
  }, {
    title: 'Messages',
    path: '/admin/messages',
    icon: <MessageSquareIcon size={20} />
  }, {
    title: 'Settings',
    path: '/admin/settings',
    icon: <SettingsIcon size={20} />
  }, {
    title: 'Website',
    path: '/',
    icon: <GlobeIcon size={20} />
  }];
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };
  const unreadCount = notifications.filter(notification => !notification.read).length;
  return <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-200">
          <Link to="/admin" className="flex items-center">
            <img src="/banwe_logo_green.png" alt="Banwee Logo" className="h-8 mr-2" />
            <span className="text-xl font-semibold text-main">Admin</span>
          </Link>
        </div>
        <div className="py-4">
          <nav>
            <ul className="space-y-1">
              {menuItems.map(item => <li key={item.path}>
                  <Link to={item.path} className={`flex items-center px-4 py-2.5 text-sm ${isActive(item.path) ? 'bg-primary text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setSidebarOpen(false)}>
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                </li>)}
            </ul>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
            <LogOutIcon size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 mr-3 md:hidden">
                <MenuIcon size={24} />
              </button>
              <h1 className="text-xl font-semibold text-main hidden md:block">
                {menuItems.find(item => isActive(item.path))?.title || 'Admin'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <button onClick={() => setSearchOpen(!searchOpen)} className="p-1 text-gray-500 hover:text-gray-700">
                  <SearchIcon size={20} />
                </button>
                {searchOpen && <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 p-2">
                    <input type="text" placeholder="Search..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                  </div>}
              </div>
              {/* Notifications */}
              <div className="relative group">
                <button className="p-1 text-gray-500 hover:text-gray-700 relative" onClick={() => setSearchOpen(false)}>
                  <BellIcon size={20} />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>}
                </button>
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-20">
                  <div className="p-2 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium">Notifications</h3>
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map(notification => <div key={notification.id} className={`p-3 border-b border-gray-100 last:border-0 ${!notification.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>)}
                  </div>
                  <div className="p-2 border-t border-gray-200 text-center">
                    <Link to="/admin/notifications" className="text-sm text-primary hover:underline">
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
              {/* User */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <span className="ml-2 text-sm font-medium hidden md:block">
                  {user?.name || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>;
};