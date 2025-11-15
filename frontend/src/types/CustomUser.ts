export interface CustomUser {
  id: string;
  username: string;
  user_type: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  total_articles?: number;
  total_comments?: number;
  date_joined: string;
}
