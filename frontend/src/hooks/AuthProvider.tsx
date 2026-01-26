import React, { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { CustomUser } from '../types/CustomUser';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const ACCESS_TOKEN_KEY = 'el_dera_blog_access_token';
const REFRESH_TOKEN_KEY = 'el_dera_blog_refresh_token';
const USER_KEY = 'el_dera_blog_user';

// Set up Axios interceptor for automatic token refresh
axios.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      const decodedToken: any = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        // Access token expired, try to refresh
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
            const newAccessToken = response.data.access;
            localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
            config.headers.Authorization = `Bearer ${newAccessToken}`;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // If refresh fails, clear tokens and redirect to login
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = '/admin/login'; // Redirect to login page
          }
        } else {
          // No refresh token, clear tokens and redirect to login
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.href = '/admin/login'; // Redirect to login page
        }
      } else {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<CustomUser | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem(USER_KEY);
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (storedUser && accessToken) {
        try {
          const decodedToken: any = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          } else {
            // Token expired, try to refresh
            await checkAuthStatus(); // This will attempt to refresh or clear
          }
        } catch (error) {
          console.error('Error decoding access token:', error);
          logout(); // Clear invalid tokens
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/token/`, { email, password });
    const { access, refresh, user } = response.data;

    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

    // Use the user data from the response instead of decoding from JWT
    const loggedInUser: CustomUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      user_type: user.user_type,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
      date_joined: user.date_joined,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!accessToken && !refreshToken) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }

    if (accessToken) {
      try {
        const decodedToken: any = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp > currentTime) {
          // Access token is valid
          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          setIsAuthenticated(true);
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        }
      } catch (error) {
        console.error('Error decoding access token:', error);
        // Fall through to refresh token logic
      }
    }

    // Access token expired or invalid, try to refresh
    if (refreshToken) {
      try {
        const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
        const newAccessToken = response.data.access;
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

        const decodedUser: any = jwtDecode(newAccessToken);
        const refreshedUser: CustomUser = {
          id: decodedUser.user_id,
          username: decodedUser.username,
          email: decodedUser.email,
          user_type: decodedUser.user_type,
          first_name: decodedUser.first_name,
          last_name: decodedUser.last_name,
          bio: decodedUser.bio,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
        setUser(refreshedUser);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        return true;
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        logout(); // Clear tokens on refresh failure
        return false;
      }
    }

    logout(); // No valid tokens, ensure logged out
    return false;
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
