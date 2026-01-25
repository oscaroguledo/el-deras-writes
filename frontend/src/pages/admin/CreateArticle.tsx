import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleForm } from '../../components/ArticleForm';
import { Article } from '../../types/Article';
import { createArticle } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth.ts';
import { toast } from 'react-toastify';

export default function CreateArticle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // Use isAuthenticated and user from useAuth

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/admin'); // Redirect if not authenticated
        }
      } catch (error) {
        navigate('/admin'); // Redirect on error
      }
    };
    verifyAuth();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (articleData: Partial<Article>) => {
    try {
      setIsSubmitting(true);
      await createArticle(articleData);
      toast.success('Article created successfully!');
      navigate('/admin/articles'); // Navigate to articles list after creation
    } catch (error) {
      toast.error('Failed to create article');
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-medium text-gray-900 dark:text-gray-100">
          Create New Article
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fill in the details to create a new article for El Dera's Blog
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6 transition-colors duration-200">
        <ArticleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} loggedInUser={user || undefined} />
      </div>
    </div>
  );
}