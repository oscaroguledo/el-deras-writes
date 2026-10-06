import axios from 'axios';
import { Article, ArticleInput, GetArticlesParams } from '../types/Article';
import { Comment } from '../types/Comment';
import { Category } from '../types/Category';
import { Tag } from '../types/Tag';
import { CustomUser } from '../types/CustomUser';
import { ContactInfo } from '../types/ContactInfo';
import { VisitorCount } from '../types/VisitorCount';
import { AdminDashboardData } from '../types/Admin';
import { Feedback } from '../types/Feedback'; // Import Feedback type
import { API_URL } from '../config';
const BASE_URL = API_URL;


interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


function toArticle(raw: any): Article {
  return { ...raw, createdAt: raw.created_at, updatedAt: raw.updated_at };
}

export async function getArticles(params: GetArticlesParams): Promise<PaginatedResponse<Article>> {
  const response = await axios.get(`${API_URL}/articles/`, { params });
  return { ...response.data, results: response.data.results.map(toArticle) };
}

/** Accepts an article id or slug. */
export async function getArticleById(id: string): Promise<Article> {
  const response = await axios.get(`${API_URL}/articles/${id}/`);
  return toArticle(response.data);
}

export async function createArticle(articleData: ArticleInput): Promise<Article> {
  const response = await axios.post(`${API_URL}/articles/`, articleData);
  return toArticle(response.data);
}

export async function updateArticle(id: string, articleData: Partial<ArticleInput>): Promise<Article> {
  const response = await axios.patch(`${API_URL}/articles/${id}/`, articleData);
  return toArticle(response.data);
}

export async function deleteArticle(id: string): Promise<void> {
  await axios.delete(`${API_URL}/articles/${id}/`);
}

export async function submitFeedback(feedback: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await axios.post(`${API_URL}/feedback/`, feedback);
}

export async function getFeedback(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<Feedback>> {
  const response = await axios.get(`${BASE_URL}/admin-api/feedback/`, { params: { page: params.page, page_size: params.pageSize, search: params.search } });
  return response.data;
}

export async function deleteFeedback(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/admin-api/feedback/${id}/`);
}

export async function approveComment(id: string): Promise<Comment> {
  const response = await axios.post(`${BASE_URL}/admin-api/comments/${id}/approve/`);
  return response.data;
}

export async function deleteComment(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/admin-api/comments/${id}/`);
}

export async function flagComment(id: string): Promise<Comment> {
  const response = await axios.post(`${BASE_URL}/admin-api/comments/${id}/flag/`);
  return response.data;
}

export async function getComments(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<Comment>> {
  const response = await axios.get(`${BASE_URL}/admin-api/comments/`, { params: { page: params.page, page_size: params.pageSize, search: params.search } });
  return response.data;
}

export async function getCommentsByArticle(articleId: string): Promise<Comment[]> {
  const response = await axios.get(`${API_URL}/articles/${articleId}/comments/`);
  return response.data;
}

export async function createComment(
  articleId: string,
  commentData: {
    content: string;
    parent?: string;
  }
): Promise<Comment> {
  const response = await axios.post(`${API_URL}/articles/${articleId}/comments/`, commentData);
  return response.data;
}

/** Flat list of every category (sections and sub-sections). */
export async function getCategories(params: { search?: string; parent?: string; top_level?: boolean } = {}): Promise<Category[]> {
  const response = await axios.get(`${API_URL}/categories/`, { params });
  return response.data;
}

/** Sections with their sub-sections nested under `children`. */
export async function getCategoryTree(): Promise<Category[]> {
  const response = await axios.get(`${API_URL}/categories/tree/`);
  return response.data;
}



export async function getTags(params: { search?: string } = {}): Promise<Tag[]> {
  const response = await axios.get(`${API_URL}/tags/`, { params });
  return response.data;
}

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<CustomUser>> {
  const response = await axios.get(`${BASE_URL}/admin-api/users/`, { params });
  return response.data;
}

export async function createUser(userData: Partial<CustomUser>): Promise<CustomUser> { // Updated type
  const response = await axios.post(`${BASE_URL}/admin-api/users/`, userData);
  return response.data;
}

export async function updateUser(id: string, userData: Partial<CustomUser>): Promise<CustomUser> { // Updated type
  const response = await axios.patch(`${BASE_URL}/admin-api/users/${id}/`, userData);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/admin-api/users/${id}/`);
}

export interface CategoryInput {
  name: string;
  description?: string;
  /** Parent section's slug or id; '' makes it a top-level section. */
  parent?: string | null;
}

export async function createCategory(categoryData: CategoryInput): Promise<Category> {
  const response = await axios.post(`${API_URL}/categories/`, categoryData);
  return response.data;
}

export async function updateCategory(id: string, categoryData: Partial<CategoryInput>): Promise<Category> {
  const response = await axios.patch(`${API_URL}/categories/${id}/`, categoryData);
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await axios.delete(`${API_URL}/categories/${id}/`);
}

export async function createTag(tagData: { name: string }): Promise<Tag> {
  const response = await axios.post(`${API_URL}/tags/`, tagData);
  return response.data;
}

export async function updateTag(id: string, tagData: { name: string }): Promise<Tag> {
  const response = await axios.patch(`${API_URL}/tags/${id}/`, tagData);
  return response.data;
}

export async function deleteTag(id: string): Promise<void> {
  await axios.delete(`${API_URL}/tags/${id}/`);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> { // Updated type
  const response = await axios.get(`${BASE_URL}/admin-api/dashboard/`);
  return response.data;
}

export async function getContactInfo(): Promise<ContactInfo> { // New function to get contact info
  const response = await axios.get(`${API_URL}/contact/`);
  return response.data;
}

export async function updateContactInfo(contactData: Partial<ContactInfo>): Promise<ContactInfo> { // Updated type
  const response = await axios.patch(`${API_URL}/contact/`, contactData);
  return response.data;
}

export async function incrementVisitorCount(): Promise<VisitorCount> { // Updated type
  const response = await axios.post(`${API_URL}/visitor-count/`);
  return response.data;
}

