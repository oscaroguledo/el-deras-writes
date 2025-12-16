import { useState, useEffect, useCallback } from 'react';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { Article } from '../utils/database';

export const useArticles = (status?: 'draft' | 'published') => {
  const { database, isInitialized } = useDatabaseContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedArticles = await database.getArticles(status);
      setArticles(fetchedArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [database, isInitialized, status]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = async (articleData: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const id = await database.createArticle(articleData);
      await fetchArticles(); // Refresh the list
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
      throw err;
    }
  };

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    try {
      await database.updateArticle(id, updates);
      await fetchArticles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
      throw err;
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      await database.deleteArticle(id);
      await fetchArticles(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
      throw err;
    }
  };

  const searchArticles = async (query: string) => {
    try {
      setLoading(true);
      const results = await database.searchArticles(query);
      setArticles(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search articles');
      console.error('Error searching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    searchArticles,
    refetch: fetchArticles
  };
};

export const useArticle = (id: string) => {
  const { database, isInitialized } = useDatabaseContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!isInitialized || !id) return;
      
      try {
        setLoading(true);
        setError(null);
        const fetchedArticle = await database.getArticleById(id);
        setArticle(fetchedArticle);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch article');
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [database, isInitialized, id]);

  const incrementViews = async () => {
    try {
      await database.incrementViews(id);
      if (article) {
        setArticle({ ...article, views: article.views + 1 });
      }
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const incrementLikes = async () => {
    try {
      await database.incrementLikes(id);
      if (article) {
        setArticle({ ...article, likes: article.likes + 1 });
      }
    } catch (err) {
      console.error('Error incrementing likes:', err);
    }
  };

  return {
    article,
    loading,
    error,
    incrementViews,
    incrementLikes
  };
};