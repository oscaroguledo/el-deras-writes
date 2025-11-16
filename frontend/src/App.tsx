import React, { useEffect, lazy } from 'react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { incrementVisitorCount } from './utils/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './pages/admin/AdminLayout';
import { CategoryProvider } from './hooks/CategoryProvider'; // Import CategoryProvider
// Layout components
const MainLayout = lazy(() => import('./components/MainLayout'));

// Lazy-loaded page components
const Home = lazy(() => import('./pages/Home'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboardOverview = lazy(() => import('./pages/admin/AdminDashboardOverview'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminArticlesPage = lazy(() => import('./pages/admin/AdminArticlesPage'));
const AdminCategoriesTagsPage = lazy(() => import('./pages/admin/AdminCategoriesTagsPage'));
const AdminCommentsPage = lazy(() => import('./pages/admin/AdminCommentsPage'));
const AdminContactInfoPage = lazy(() => import('./pages/admin/AdminContactInfoPage'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage')); // Import AdminFeedbackPage
const CreateArticle = lazy(() => import('./pages/admin/CreateArticle'));
const EditArticle = lazy(() => import('./pages/admin/EditArticle'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

import { ProtectedRoute } from './components/ProtectedRoute';

export const routes = createRoutesFromElements(
  <Route>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="article/:id" element={<ArticleDetail />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="terms" element={<Terms />} />
      <Route path="privacy" element={<Privacy />} />
    </Route>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<AdminDashboardOverview />} />  
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="articles" element={<AdminArticlesPage />} />
      <Route path="articles/create" element={<CreateArticle />} />
      <Route path="articles/edit/:id" element={<EditArticle />} />
      <Route path="categories-tags" element={<AdminCategoriesTagsPage />} />
      <Route path="comments" element={<AdminCommentsPage />} />
      <Route path="contact-info" element={<AdminContactInfoPage />} />
      <Route path="profile" element={<AdminProfilePage />} />
      <Route path="feedback" element={<AdminFeedbackPage />} /> {/* Add AdminFeedbackPage route */}
    </Route>
  </Route>
);

export function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    incrementVisitorCount().catch(error => console.error("Failed to increment visitor count:", error));
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CategoryProvider> {/* Wrap children with CategoryProvider */}
        {children}
      </CategoryProvider>
      <ToastContainer />
    </div>
  );
}