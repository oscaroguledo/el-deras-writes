import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleById } from '../utils/api';
import { Article } from '../types/Article';
import { CommentSection } from '../components/CommentSection';
import { CalendarIcon, ClockIcon, TagIcon, ChevronLeftIcon } from 'lucide-react';
import { MetaData } from '../components/MetaData';

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
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>;
  }
  if (error || !article) {
    return <div className="flex justify-center items-center h-64">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">
          {error || 'Article not found'}
        </h2>
        <Link to="/" className="text-gray-600 hover:text-gray-900 inline-flex items-center">
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
        url={`${window.location.origin}/article/${article.id}`}
      />
      <article className="py-8">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back to articles
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-gray-900 mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4 mb-6">
            <div className="flex items-center">
              {article.authorImage ? <img src={article.authorImage} alt={article.author} className="h-8 w-8 rounded-full mr-2" /> : <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 mr-2">
                  {article.author && article.author.charAt(0).toUpperCase()}
                </div>}
              <span>{article.author}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>
                {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{article.readTime || '5 min read'}</span>
            </div>
            {article.category && <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                <Link to={`/?category=${encodeURIComponent(article.category)}`} className="hover:underline">
                  {article.category}
                </Link>
              </div>}
          </div>
        </div>
        {article.image && <div className="mb-8 rounded-lg overflow-hidden">
            <img src={article.image} alt={article.title} className="w-full h-auto object-cover" />
          </div>}
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{
        __html: article.content
      }} />
        <CommentSection articleId={article.id} />
      </article>
    </>
  );
}