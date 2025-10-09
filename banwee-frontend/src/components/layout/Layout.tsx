import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { MobileSearch } from './MobileSearch';
import { MobileCategories } from './MobileCategories';
interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  return <div className="flex flex-col min-h-screen">
      <Header onSearchClick={() => setMobileSearchOpen(true)} onCategoriesClick={() => setMobileCategoriesOpen(true)} />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav onSearchClick={() => setMobileSearchOpen(true)} onCategoriesClick={() => setMobileCategoriesOpen(true)} />
      <MobileSearch isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
      <MobileCategories isOpen={mobileCategoriesOpen} onClose={() => setMobileCategoriesOpen(false)} />
    </div>;
};