import { useState, useEffect, useCallback } from 'react';
import { getArticles, getArticleById, createArticle as apiCreateArticle, updateArticle as apiUpdateArticle, deleteArticle as apiDeleteArticle } from '../utils/api';
import { Article } from '../types/Article';

export const useArticles = (status?: 'draft' | 'published') => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getArticles({ status });
      setArticles(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(async (articleData: Partial<Article>) => {
    try {
      const newArticle = await apiCreateArticle(articleData);
      setArticles(prev => [newArticle, ...prev]);
      return newArticle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
      throw err;
    }
  }, []);

  const updateArticle = useCallback(async (id: string, articleData: Partial<Article>) => {
    try {
      const updatedArticle = await apiUpdateArticle(id, articleData);
      setArticles(prev => prev.map(article => 
        article.id === id ? updatedArticle : article
      ));
      return updatedArticle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
      throw err;
    }
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    try {
      await apiDeleteArticle(id);
      setArticles(prev => prev.filter(article => article.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
      throw err;
    }
  }, []);

  return {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    refetch: fetchArticles
  };
};

export const useArticle = (id: string) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const fetchedArticle = await getArticleById(id);
        setArticle(fetchedArticle);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch article');
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  return {
    article,
    loading,
    error
  };
};