import { Article } from './Article';
import { CustomUser } from './CustomUser';

export interface Comment {
  id: string;
  article: Article;
  author: CustomUser;
  content: string;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  parent?: string;
  replies?: Comment[];
}