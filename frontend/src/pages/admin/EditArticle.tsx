import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleForm } from '../../components/ArticleForm';
import { getArticleById, updateArticle } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth.ts';
import { toast } from 'react-toastify';
import { Article } from '../../types/Article';
import SkeletonLoader from '../../components/SkeletonLoader';
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
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    verifyAuthAndFetchArticle();
  }, [id, navigate, isAuthenticated]);
  const handleSubmit = async (formData: Partial<Article>) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await updateArticle(id, formData);
      toast.success('Article updated successfully!');
      navigate('/admin/articles'); // Navigate to articles list after update
    } catch (error) {
      toast.error('Failed to update article');
      console.error(error);
      setIsSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <SkeletonLoader className="h-8 w-64 mb-2" />
          <SkeletonLoader className="h-5 w-96" />
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* ArticleForm Skeletons */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Excerpt */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-20 w-full" />
            </div>
            {/* Content */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-40 w-full" />
            </div>
            {/* Image */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Category */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Tags */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Status */}
            <div>
              <SkeletonLoader className="h-4 w-24 mb-1" />
              <SkeletonLoader className="h-10 w-full" />
            </div>
            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <SkeletonLoader className="h-10 w-24" />
              <SkeletonLoader className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
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