import { Article } from './Article';

export interface CommentAuthor {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export interface Comment {
  id: string;
  article?: Article;
  author: CommentAuthor | null; // Author can be null for anonymous comments
  content: string;
  created_at: string;
  updated_at: string;
  parent?: string;
  replies?: Comment[];
  approved: boolean;
  is_flagged: boolean;
}