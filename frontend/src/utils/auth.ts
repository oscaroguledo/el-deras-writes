// This file would normally handle authentication with your backend
// For demonstration purposes, we'll use localStorage for simple auth simulation
const TOKEN_KEY = 'elder_blog_auth_token';
const USER_KEY = 'elder_blog_user';
// Demo credentials
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'password';
export async function login(username: string, password: string): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  // In a real application, you would validate credentials with your backend
  // const response = await axios.post('/api/auth/login', { username, password })
  // For demonstration, we'll use hardcoded credentials
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    // Simulate a JWT token
    const token = `demo-token-${Date.now()}`;
    const user = {
      username,
      name: 'Admin User',
      role: 'admin'
    };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  throw new Error('Invalid credentials');
}
export async function logout(): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real application, you might want to invalidate the token on the server
  // await axios.post('/api/auth/logout')
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export async function checkAuthStatus(): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real application, you would verify the token with your backend
  // try {
  //   await axios.get('/api/auth/verify')
  //   return true
  // } catch (error) {
  //   return false
  // }
  // For demonstration, we'll just check if the token exists
  return !!localStorage.getItem(TOKEN_KEY);
}
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getUser(): any {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}