import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Tag,
  Settings,
  Info,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navLinks = [
  { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/admin/articles', icon: <FileText size={20} />, label: 'Articles' },
  { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
  { to: '/admin/comments', icon: <MessageSquare size={20} />, label: 'Comments' },
  { to: '/admin/categories-tags', icon: <Tag size={20} />, label: 'Categories & Tags' },
  { to: '/admin/contact-info', icon: <Info size={20} />, label: 'Contact Info' },
];

export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }: AdminSidebarProps) {
  return (
    <>
      <aside
        className={`bg-gray-900 text-white w-64 min-h-screen p-4 fixed md:relative md:translate-x-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="flex justify-between items-center mb-6">
          
          <button
            className="md:hidden text-white"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to} className="mb-2">
                <NavLink
                  to={link.to}
                  end={link.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {link.icon}
                  <span className="ml-4">{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}
