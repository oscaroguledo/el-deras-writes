import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { getCategoryTree } from '../utils/api';
import { Category } from '../types/Category';

interface CategoryContextType {
  /** Top-level sections, each with its sub-sections under `children`. */
  sections: Category[];
  /** Every category, sections and sub-sections, in menu order. */
  categories: Category[];
  /** Find a section or sub-section by slug. */
  findBySlug: (slug: string | null | undefined) => Category | undefined;
  loading: boolean;
  error: string | null;
  refetchCategories: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [sections, setSections] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSections(await getCategoryTree());
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

  const categories = useMemo(() => sections.flatMap(s => [s, ...s.children]), [sections]);
  const findBySlug = useCallback(
    (slug: string | null | undefined) => (slug ? categories.find(c => c.slug === slug) : undefined),
    [categories]
  );

  return (
    <CategoryContext.Provider value={{ sections, categories, findBySlug, loading, error, refetchCategories }}>
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
