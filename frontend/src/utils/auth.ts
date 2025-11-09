import axios from 'axios';
const API_URL = 'http://localhost:8000/api';

const USER_KEY = 'elder_blog_user';

export async function login(username: string, password: string): Promise<void> {
  const response = await axios.post(`${API_URL}/auth/login/`, { username, password });
  const user = response.data.user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function logout(): Promise<void> {
  // In a real application, you might want to invalidate the token on the server
  // await axios.post('/api/auth/logout')
  localStorage.removeItem(USER_KEY);
}

export async function checkAuthStatus(): Promise<boolean> {
  // For demonstration, we'll just check if the user exists in local storage
  return !!localStorage.getItem(USER_KEY);
}

export function getUser(): any {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}