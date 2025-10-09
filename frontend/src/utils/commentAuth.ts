import { CommentUser } from '../types/Comment';
const USER_KEY = 'el_deras_comment_user';
const USERS_STORE_KEY = 'el_deras_comment_users';
// Simple password generation based on name and email
export function generatePassword(name: string, email: string): string {
  const namePart = name.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 5);
  const emailPart = email.split('@')[0].slice(0, 5);
  return `${namePart}${emailPart}_${Math.floor(Math.random() * 1000)}`;
}
// Register a new user
export function registerUser(name: string, email: string): CommentUser {
  // Check if user already exists by email
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    // User already exists, just log them in
    setCurrentUser(existingUser);
    return existingUser;
  }
  // Create new user
  const newUser: CommentUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email,
    createdAt: new Date().toISOString()
  };
  // Save to local storage
  const users = getAllUsers();
  users.push(newUser);
  localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
  // Set as current user
  setCurrentUser(newUser);
  return newUser;
}
// Get user by email
export function getUserByEmail(email: string): CommentUser | null {
  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
}
// Get all users
export function getAllUsers(): CommentUser[] {
  const usersJson = localStorage.getItem(USERS_STORE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}
// Set current user
export function setCurrentUser(user: CommentUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
// Get current user
export function getCurrentUser(): CommentUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}
// Logout current user
export function logoutUser(): void {
  localStorage.removeItem(USER_KEY);
}
// Check if user is logged in
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}