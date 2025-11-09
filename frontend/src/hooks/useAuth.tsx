import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const USER_KEY = 'elder_blog_user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/login/`, { username, password });
    const loggedInUser = response.data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    const storedUser = localStorage.getItem(USER_KEY);
    const status = !!storedUser;
    setIsAuthenticated(status);
    if (status && !user) {
      setUser(JSON.parse(storedUser));
    }
    return status;
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuthStatus,
  };

  // Use React.createElement to avoid JSX parsing in a .ts file
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
