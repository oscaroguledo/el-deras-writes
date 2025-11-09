import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleForm } from '../components/ArticleForm';
import { getArticleById, updateArticle } from '../utils/api';
import { toast } from 'react-toastify';
import { Article } from '../types/Article';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth

export default function EditArticle() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Use isAuthenticated from useAuth
  useEffect(() => {
    const verifyAuthAndFetchArticle = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/admin');
          return;
        }
        if (id) {
          const data = await getArticleById(id);
          setArticle(data);
        }
      } catch (error) {
        toast.error('Failed to load article');
        console.error(error);
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };
    verifyAuthAndFetchArticle();
  }, [id, navigate]);
  const handleSubmit = async (formData: FormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await updateArticle(id, formData);
      toast.success('Article updated successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to update article');
      console.error(error);
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
  }
  if (!article) {
    return <div className="text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">
          Article not found
        </h2>
        <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-900">
          Back to dashboard
        </button>
      </div>;
  }
  return <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Edit Article
        </h1>
        <p className="mt-2 text-gray-600">Update the details of your article</p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm initialData={article} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>;
}