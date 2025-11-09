import { Category } from './Category';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: Category;
  author: { username: string; first_name: string; last_name: string; }; // Updated to reflect CustomUser structure
  authorImage?: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}