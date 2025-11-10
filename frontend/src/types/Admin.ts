export interface AdminDashboardData {
  total_users: number;
  total_articles: number;
  total_comments: number;
  total_categories: number;
  total_tags: number;
  total_visitors: number;
  top_category: string;
  most_used_tag: string;
  new_users_this_month: number;
  recently_registered_users: Array<{ id: string; username: string; email: string; date_joined: string; }>;
  recent_articles: Array<{ id: string; title: string; author__username: string; created_at: string }>;
  recent_comments: Array<{ id: string; content: string; article__title: string; author__username: string; created_at: string }>;
  recent_categories: Array<{ id: number; name: string }>;
  recent_tags: Array<{ id: number; name: string }>;
  recent_visitors: Array<{ id: number; ip_address: string; timestamp: string; }>;
  total_visitors_by_date: Record<string, number>;
}