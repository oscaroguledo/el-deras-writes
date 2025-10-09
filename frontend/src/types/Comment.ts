export interface Comment {
  id: string;
  articleId: string;
  parentId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}
export interface CommentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}