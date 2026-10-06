export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string; // category name
  category_slug: string;
  tags: string[];
  author: string; // display name
  authorImage?: string;
  readTime?: number;
  formatted_read_time?: string;
  status: 'draft' | 'published';
  featured: boolean;
  views?: number;
  likes?: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // camelCase aliases added by utils/api.ts
  createdAt: string;
  updatedAt: string;
}

/** What the backend accepts when creating or updating an article. */
export interface ArticleInput {
  title: string;
  content: string;
  excerpt: string;
  /** Category slug, name or id. */
  category: string;
  tags?: string[];
  image?: string;
  readTime?: number;
  status?: 'draft' | 'published';
  featured?: boolean;
}

export interface GetArticlesParams {
  search?: string | null;
  category?: string | null;
  tag?: string | null;
  status?: string | null;
  page?: number;
  page_size?: number;
}
