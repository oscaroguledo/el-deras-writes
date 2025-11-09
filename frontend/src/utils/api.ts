import axios from 'axios';
import { Article } from '../types/Article';
import { Comment } from '../types/Comment';
import { Category } from '../types/Category';
import { Tag } from '../types/Tag';
import { CustomUser } from '../types/CustomUser';

const API_URL = 'http://localhost:8000/api';

interface GetArticlesParams {
  search?: string | null;
  category?: string | null;
  page?: number;
  page_size?: number;
}

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

export async function getComments(): Promise<Comment[]> {
  const response = await axios.get(`${API_URL}/comments/`);
  return response.data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await axios.get(`${API_URL}/categories/`);
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

export async function createUser(userData: any): Promise<CustomUser> {
  const response = await axios.post(`${API_URL}/users/`, userData);
  return response.data;
}

export async function updateUser(id: string, userData: any): Promise<CustomUser> {
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

export async function getAdminDashboardData(): Promise<any> {
  const response = await axios.get(`${API_URL}/admin/dashboard/`);
  return response.data;
}

export async function updateContactInfo(contactData: any): Promise<any> {
  const response = await axios.patch(`${API_URL}/contact-info/`, contactData);
  return response.data;
}

export async function incrementVisitorCount(): Promise<any> {
  const response = await axios.post(`${API_URL}/visitor-count/increment/`);
  return response.data;
}