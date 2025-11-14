import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes, App } from "./App";
import { AuthProvider } from './hooks/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const router = createBrowserRouter(routes);

const LoadingSkeleton = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-300 h-12 w-12"></div>
      <div className="flex-1 space-y-4 py-1">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

export function AppRouter() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSkeleton />}>
        <App>
          <RouterProvider router={router} />
        </App>
      </Suspense>
      <ToastContainer position="bottom-right" />
    </AuthProvider>
  );
}