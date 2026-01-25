import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleById } from '../utils/api';
import { Article } from '../types/Article';
import { LazyCommentSection } from '../components/LazyCommentSection';
import { LazyImage } from '../components/LazyImage';
import { LazyContent } from '../components/LazyContent';
import { CalendarIcon, ClockIcon, TagIcon, ChevronLeftIcon } from 'lucide-react';
import { MetaData } from '../components/MetaData';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ArticleDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          console.log("Fetching article with ID:", id); // Add this line for debugging
          const data = await getArticleById(id);
          setArticle(data);
        }
      } catch (err) {
        setError('Failed to load article. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);
  if (loading) {
    return (
      <div className="py-8">
        <SkeletonLoader className="h-6 w-48 mb-6 dark:bg-gray-700" /> {/* Back to articles link */}
        <div className="mb-8">
          <SkeletonLoader className="h-10 w-3/4 mb-4 dark:bg-gray-700" /> {/* Title */}
          <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4 mb-6">
            <SkeletonLoader className="h-8 w-24 dark:bg-gray-700" /> {/* Author */}
            <SkeletonLoader className="h-8 w-32 dark:bg-gray-700" /> {/* Date */}
            <SkeletonLoader className="h-8 w-24 dark:bg-gray-700" /> {/* Read Time */}
            <SkeletonLoader className="h-8 w-24 dark:bg-gray-700" /> {/* Category */}
          </div>
        </div>
        <SkeletonLoader className="h-96 w-full mb-8 rounded-lg dark:bg-gray-700" /> {/* Article Image */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
          <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
          <SkeletonLoader className="h-6 w-5/6 mb-2 dark:bg-gray-700" />
          <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
          <SkeletonLoader className="h-6 w-4/5 dark:bg-gray-700" />
        </div>
        <div className="mt-12">
          <SkeletonLoader className="h-8 w-48 mb-6 dark:bg-gray-700" /> {/* Comments title */}
          <SkeletonLoader className="h-24 w-full mb-4 dark:bg-gray-700" /> {/* Comment form */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-4">
              <SkeletonLoader className="h-6 w-32 mb-2 dark:bg-gray-700" /> {/* Comment author */}
              <SkeletonLoader className="h-16 w-full dark:bg-gray-700" /> {/* Comment content */}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error || !article) {
    return <div className="flex flex-col justify-center items-center h-64">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">
          {error || 'Article not found'}
        </h2>
        <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 inline-flex items-center">
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back to home
        </Link>
      </div>;
  }
  return (
    <>
      <MetaData
        title={article.title}
        description={article.excerpt || article.title}
        image={article.image || undefined}
        url={`${window.location.origin}/article/${article._id}`}
      />
      <article className="py-8">
        <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back to articles
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-gray-900 dark:text-gray-100 mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4 mb-6">
            <div className="flex items-center">
              {article.authorImage ? (
                <LazyImage 
                  src={article.authorImage} 
                  alt={typeof article.author === 'string' ? article.author : article.author.username} 
                  className="h-8 w-8 rounded-full mr-2"
                  fallbackType="avatar"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 mr-2">
                  {typeof article.author === 'string' ? article.author.charAt(0).toUpperCase() : article.author?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-800 dark:text-gray-200">{typeof article.author === 'string' ? article.author : `${article.author.first_name} ${article.author.last_name}`}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>
                {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>{article.formatted_read_time || '5 mins'}</span>
            </div>
            {article.category && <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                <Link to={`/?category=${encodeURIComponent(article.category)}`} className="hover:underline text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  {article.category}
                </Link>
              </div>}
          </div>
        </div>
        {article.image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <LazyImage 
              src={article.image} 
              alt={article.title} 
              className="w-full h-auto object-cover"
              fallbackType="article"
            />
          </div>
        )}
        <LazyContent
          fallback={
            <div className="article-content">
              <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
              <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
              <SkeletonLoader className="h-6 w-5/6 mb-2 dark:bg-gray-700" />
              <SkeletonLoader className="h-6 w-full mb-2 dark:bg-gray-700" />
              <SkeletonLoader className="h-6 w-4/5 dark:bg-gray-700" />
            </div>
          }
          threshold={0.1}
          rootMargin="50px"
        >
          <div className="article-content animate-fade-in" dangerouslySetInnerHTML={{
            __html: article.content
          }} />
        </LazyContent>
        <LazyCommentSection articleId={article._id} />
      </article>
    </>
  );
}