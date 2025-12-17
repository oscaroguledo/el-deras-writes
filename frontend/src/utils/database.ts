// Minimal database types and interface for frontend
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  user_type: 'admin' | 'normal' | 'guest';
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_id: string;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

// Minimal database interface
class DatabaseInterface {
  async initialize(): Promise<void> {
    // Stub implementation
    console.log('Database initialized (stub)');
  }

  async getUserById(id: string): Promise<User | null> {
    // Stub implementation
    return null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Stub implementation
    return null;
  }

  async createUser(userData: Partial<User>): Promise<string> {
    // Stub implementation
    return 'stub-user-id';
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    // Stub implementation
  }

  async getArticles(status?: 'draft' | 'published'): Promise<Article[]> {
    // Stub implementation
    return [];
  }

  async getArticleById(id: string): Promise<Article | null> {
    // Stub implementation
    return null;
  }

  async createArticle(articleData: Partial<Article>): Promise<string> {
    // Stub implementation
    return 'stub-article-id';
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<void> {
    // Stub implementation
  }

  async deleteArticle(id: string): Promise<void> {
    // Stub implementation
  }

  async searchArticles(query: string): Promise<Article[]> {
    // Stub implementation
    return [];
  }

  async incrementViews(id: string): Promise<void> {
    // Stub implementation
  }

  async incrementLikes(id: string): Promise<void> {
    // Stub implementation
  }

  exportDatabase(): Uint8Array {
    // Stub implementation
    return new Uint8Array();
  }

  async clearDatabase(): Promise<void> {
    // Stub implementation
  }
}

export const database = new DatabaseInterface();