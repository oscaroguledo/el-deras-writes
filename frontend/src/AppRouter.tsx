import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes, App } from "./App";
import { AuthProvider } from './hooks/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <AuthProvider>
      <App>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
        <ToastContainer position="bottom-right" />
      </App>
    </AuthProvider>
  );
}