import { Category } from './Category';

export interface Article {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: Category;
  author: { id:string; username: string; first_name: string; last_name: string; }; // Updated to reflect CustomUser structure
  authorImage?: string;
  readTime?: string;
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