import React, { useEffect } from 'react'; // Import useEffect
import { SpeedInsights } from "@vercel/speed-insights/react"
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ArticleDetail } from './pages/ArticleDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview'; // New import
import { AdminUsersPage } from './pages/admin/AdminUsersPage'; // New import
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage'; // New import
import { AdminCategoriesTagsPage } from './pages/admin/AdminCategoriesTagsPage'; // New import
import { AdminCommentsPage } from './pages/admin/AdminCommentsPage'; // New import
import { AdminContactInfoPage } from './pages/admin/AdminContactInfoPage'; // New import
import { CreateArticle } from './pages/CreateArticle';
import { EditArticle } from './pages/EditArticle';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { ToastContainer } from 'react-toastify';
import { incrementVisitorCount } from './utils/api'; // Import incrementVisitorCount


import 'react-toastify/dist/ReactToastify.css';
export function App() {
  useEffect(() => {
    incrementVisitorCount().catch(error => console.error("Failed to increment visitor count:", error));
  }, []); // Run once on mount

  return <BrowserRouter>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={<AdminLogin />} />
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboardOverview />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/articles" element={<AdminArticlesPage />} />
            <Route path="/admin/categories-tags" element={<AdminCategoriesTagsPage />} />
            <Route path="/admin/comments" element={<AdminCommentsPage />} />
            <Route path="/admin/contact-info" element={<AdminContactInfoPage />} />
            <Route path="/admin/create" element={<CreateArticle />} />
            <Route path="/admin/edit/:id" element={<EditArticle />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" />
      </div>
    </BrowserRouter>;
}