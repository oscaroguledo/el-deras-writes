export interface Article {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  authorImage?: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}