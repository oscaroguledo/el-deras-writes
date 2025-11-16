import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getCategories } from '../utils/api'; // Assuming getCategories is already defined
import { Category } from '../types/Category'; // Assuming Category type is defined

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetchCategories: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories.');
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(); // Initial fetch

    const intervalId = setInterval(fetchCategories, 15 * 60 * 1000); // Fetch every 15 minutes

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchCategories]);

  const refetchCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider value={{ categories, loading, error, refetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
