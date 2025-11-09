import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader'; // Import AdminHeader
import { AdminFooter } from '../../components/AdminFooter'; // Import AdminFooter

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Use flex-col and min-h-screen for sticky footer */}
      <AdminHeader />
      <div className="flex flex-grow"> {/* flex-grow to push footer to bottom */}
        <AdminSidebar />
        <main className="flex-grow p-8"> {/* Use main tag for content */}
          <Outlet /> {/* This will render the nested admin routes */}
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}
