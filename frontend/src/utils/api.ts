import axios from 'axios';
import { Article, GetArticlesParams } from '../types/Article';
import { Comment } from '../types/Comment';
import { Category } from '../types/Category';
import { Tag } from '../types/Tag';
import { CustomUser } from '../types/CustomUser';
import { ContactInfo } from '../types/ContactInfo'; // New import
import { VisitorCount } from '../types/VisitorCount'; // New import
import { AdminDashboardData } from '../types/Admin'; // New import
const API_URL = 'http://localhost:8000/api';


interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export async function getArticles(params: GetArticlesParams): Promise<PaginatedResponse<Article>> {
  const response = await axios.get(`${API_URL}/articles/`, { params });
  console.log(response.data);
  return response.data;
}

export async function getArticleById(id: string): Promise<Article> {
  const response = await axios.get(`${API_URL}/articles/${id}/`);
  return response.data;
}

export async function createArticle(formData: FormData): Promise<Article> {
  const response = await axios.post(`${API_URL}/articles/`, formData);
  return response.data;
}

export async function updateArticle(id: string, formData: FormData): Promise<Article> {
  const response = await axios.put(`${API_URL}/articles/${id}/`, formData);
  return response.data;
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



// ... (existing code)

export async function getComments(): Promise<Comment[]> {
  const response = await axios.get(`${API_URL}/comments/`);
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

export async function getCategories(): Promise<Category[]> {
  const response = await axios.get(`${API_URL}/categories/`);
  return response.data;
}

export async function getTopFiveCategories(): Promise<Category[]> {
  const response = await axios.get(`${API_URL}/categories/top_five/`);
  return response.data;
}

export async function getTags(): Promise<Tag[]> {
  const response = await axios.get(`${API_URL}/tags/`);
  return response.data;
}

export async function getUsers(): Promise<CustomUser[]> {
  const response = await axios.get(`${API_URL}/users/`);
  return response.data;
}

export async function createUser(userData: Partial<CustomUser>): Promise<CustomUser> { // Updated type
  const response = await axios.post(`${API_URL}/users/`, userData);
  return response.data;
}

export async function updateUser(id: string, userData: Partial<CustomUser>): Promise<CustomUser> { // Updated type
  const response = await axios.patch(`${API_URL}/users/${id}/`, userData);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`${API_URL}/users/${id}/`);
}

export async function createCategory(categoryData: { name: string }): Promise<Category> {
  const response = await axios.post(`${API_URL}/categories/`, categoryData);
  return response.data;
}

export async function updateCategory(id: string, categoryData: { name: string }): Promise<Category> {
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
  const response = await axios.get(`${API_URL}/admin/dashboard/`);
  return response.data;
}

export async function getContactInfo(): Promise<ContactInfo> { // New function to get contact info
  const response = await axios.get(`${API_URL}/contact-info/`);
  return response.data;
}

export async function updateContactInfo(contactData: Partial<ContactInfo>): Promise<ContactInfo> { // Updated type
  const response = await axios.patch(`${API_URL}/contact-info/`, contactData);
  return response.data;
}

export async function incrementVisitorCount(): Promise<VisitorCount> { // Updated type
  const response = await axios.post(`${API_URL}/visitor-count/increment/`);
  return response.data;
}
