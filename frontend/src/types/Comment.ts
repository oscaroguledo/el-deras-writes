export interface CommentAuthor {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export interface CommentArticle {
  id: string;
  title: string;
  slug: string;
}

export interface Comment {
  id: string;
  article?: CommentArticle;
  author: CommentAuthor | null; // null for anonymous comments
  content: string;
  created_at: string;
  updated_at: string;
  parent?: string | null;
  replies?: Comment[];
  approved: boolean;
  is_flagged: boolean;
}
