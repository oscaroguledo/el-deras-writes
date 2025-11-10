import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleForm } from '../../components/ArticleForm';
import { createArticle } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export default function CreateArticle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Use isAuthenticated from useAuth
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/admin');
        }
      } catch (error) {
        navigate('/admin');
      }
    };
    verifyAuth();
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      await createArticle(formData);
      toast.success('Article created successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to create article');
      console.error(error);
      setIsSubmitting(false);
    }
  };
  return <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Create New Article
        </h1>
        <p className="mt-2 text-gray-600">
          Fill in the details to create a new article for Elder's Blog
        </p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>;
}