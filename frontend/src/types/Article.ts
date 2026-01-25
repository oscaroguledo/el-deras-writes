import { Category } from './Category';

export interface Article {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string; // Category is returned as a string from the API
  author: string; // Author is returned as a string from the API
  authorImage?: string;
  readTime?: number;
  formatted_read_time?: string;
  createdAt: string; 
  updatedAt: string;
  views?: number;
  likes?: number;
}
export interface GetArticlesParams {
  search?: string | null;
  category?: string | null;
  page?: number;
  page_size?: number;
}