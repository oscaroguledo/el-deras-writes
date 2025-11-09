import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MetaData } from './MetaData';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MetaData />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
