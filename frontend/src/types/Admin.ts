import { Article } from './Article';
import { CustomUser } from './CustomUser';
import { Comment } from './Comment';
import { Category } from './Category';
import { Tag } from './Tag';

export interface AdminDashboardData {
  total_visitors: number;
  recently_registered_users: CustomUser[];
  recent_articles: Article[];
  recent_comments: Comment[];
  recent_categories: Category[];
  recent_tags: Tag[];
  top_authors: CustomUser[];
  most_viewed_articles: Article[];
  most_liked_articles: Article[];
  weekly_visits: number;
  articles_this_week: number;
  comments_this_week: number;
  pending_comments: number;
  flagged_comments: number;
  inactive_users: number;
  avg_views_per_article: number;
  avg_comments_per_article: number;
  total_articles: number;
  total_comments: number;
  total_categories: number;
  total_tags: number;
}