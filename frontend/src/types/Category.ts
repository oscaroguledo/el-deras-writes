export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  /** Published articles, including those in sub-sections. */
  article_count: number;
  /** Sub-sections; only filled by the tree endpoint. */
  children: Category[];
}
