export interface Article {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: { username: string; first_name: string; last_name: string; }; // Updated to reflect CustomUser structure
  authorImage?: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}
