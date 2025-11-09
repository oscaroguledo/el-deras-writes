import React, { useEffect, lazy, Suspense } from 'react'; // Import useEffect, lazy, Suspense
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Routes, Route, Navigate } from 'react-router-dom';
import { incrementVisitorCount } from './utils/api'; // Import incrementVisitorCount

// Layout components
const MainLayout = lazy(() => import('./components/MainLayout')); // Lazy load MainLayout

// Lazy-loaded page components
const Home = lazy(() => import('./pages/Home'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardOverview = lazy(() => import('./pages/admin/AdminDashboardOverview'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminArticlesPage = lazy(() => import('./pages/admin/AdminArticlesPage'));
const AdminCategoriesTagsPage = lazy(() => import('./pages/admin/AdminCategoriesTagsPage'));
const AdminCommentsPage = lazy(() => import('./pages/admin/AdminCommentsPage'));
const AdminContactInfoPage = lazy(() => import('./pages/admin/AdminContactInfoPage'));
const CreateArticle = lazy(() => import('./pages/CreateArticle'));
const EditArticle = lazy(() => import('./pages/EditArticle'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

import 'react-toastify/dist/ReactToastify.css';
export function App() {
  useEffect(() => {
    incrementVisitorCount().catch(error => console.error("Failed to increment visitor count:", error));
  }, []); // Run once on mount

  return (
      <div className="min-h-screen bg-white flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="article/:id" element={<ArticleDetail />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
            </Route>
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
                  </Suspense>
                
                <ToastContainer position="bottom-right" />
              </div>
          );
        }