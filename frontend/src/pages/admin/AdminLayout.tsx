import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
const AdminSidebar = lazy(() => import('../../components/AdminSidebar'));
const AdminHeader = lazy(() => import('../../components/AdminHeader'));
const AdminFooter = lazy(() => import('../../components/components/AdminFooter'));

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div>Loading Admin Header...</div>}>
        <AdminHeader />
      </Suspense>
      <div className="flex flex-grow">
        <Suspense fallback={<div>Loading Admin Sidebar...</div>}>
          <AdminSidebar />
        </Suspense>
        <main className="flex-grow p-8">
          <Outlet />
        </main>
      </div>
      <Suspense fallback={<div>Loading Admin Footer...</div>}>
        <AdminFooter />
      </Suspense>
    </div>
  );
}
