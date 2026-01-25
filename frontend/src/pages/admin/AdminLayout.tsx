import React, { Suspense, useState } from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import AdminFooter from '../../components/AdminFooter';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigation = useNavigation();

  const isLoading = navigation.state === 'loading';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1">
        <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 p-4 md:p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <Suspense fallback={<div className="text-gray-900 dark:text-gray-100">Loading page...</div>}>
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}
