import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
const Header = lazy(() => import('./Header'));
const Footer = lazy(() => import('./Footer'));
import { MetaData } from './MetaData';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MetaData />
      <Suspense fallback={<div>Loading Header...</div>}>
        <Header />
      </Suspense>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-grow">
        <Outlet />
      </main>
      <Suspense fallback={<div>Loading Footer...</div>}>
        <Footer />
      </Suspense>
    </div>
  );
}
