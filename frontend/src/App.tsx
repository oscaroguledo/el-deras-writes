import React, { useEffect } from 'react'; // Import useEffect
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ArticleDetail } from './pages/ArticleDetail';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage';
import { AdminCategoriesTagsPage } from './pages/admin/AdminCategoriesTagsPage';
import { AdminCommentsPage } from './pages/admin/AdminCommentsPage';
import { AdminContactInfoPage } from './pages/admin/AdminContactInfoPage';
import { CreateArticle } from './pages/CreateArticle';
import { EditArticle } from './pages/EditArticle';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { ToastContainer } from 'react-toastify';
import { incrementVisitorCount } from './utils/api'; // Import incrementVisitorCount
import { MetaData } from './components/MetaData';


import 'react-toastify/dist/ReactToastify.css';
export function App() {
  useEffect(() => {
    incrementVisitorCount().catch(error => console.error("Failed to increment visitor count:", error));
  }, []); // Run once on mount

  return (
      <div className="min-h-screen bg-white flex flex-col">
        <MetaData />
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardOverview />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="articles" element={<AdminArticlesPage />} />
              <Route path="articles/create" element={<CreateArticle />} />
              <Route path="articles/edit/:id" element={<EditArticle />} />
              <Route path="categories-tags" element={<AdminCategoriesTagsPage />} />
              <Route path="comments" element={<AdminCommentsPage />} />
              <Route path="contact-info" element={<AdminContactInfoPage />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" />
      </div>
  );
}