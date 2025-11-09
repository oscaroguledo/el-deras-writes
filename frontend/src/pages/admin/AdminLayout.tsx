import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/AdminSidebar';

export function AdminLayout() {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <Outlet /> {/* This will render the nested admin routes */}
      </div>
    </div>
  );
}
