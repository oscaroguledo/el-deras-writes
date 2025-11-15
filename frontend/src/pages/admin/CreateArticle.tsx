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
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Create New Article
        </h1>
        <p className="mt-2 text-gray-600">
          Fill in the details to create a new article for Elder's Blog
        </p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} loggedInUser={user || undefined} />
      </div>
    </div>
  );
}