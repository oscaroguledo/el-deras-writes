import { useState, useEffect } from 'react';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { User } from '../utils/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useAuth = () => {
  const { database, isInitialized } = useDatabaseContext();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isInitialized) return;

      try {
        // Check if user is logged in (stored in localStorage)
        const storedUserId = localStorage.getItem('currentUserId');
        if (storedUserId) {
          const user = await database.getUserById(storedUserId);
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              loading: false
            });
            return;
          }
        }
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    };

    checkAuthStatus();
  }, [database, isInitialized]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await database.getUserByEmail(email);
      if (user && user.password === password) { // In real app, use proper password hashing
        localStorage.setItem('currentUserId', user.id);
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUser = await database.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const userId = await database.createUser({
        ...userData,
        user_type: 'normal',
        is_staff: false,
        is_active: true,
        is_superuser: false
      });

      const newUser = await database.getUserById(userId);
      if (newUser) {
        localStorage.setItem('currentUserId', userId);
        setAuthState({
          user: newUser,
          isAuthenticated: true,
          loading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUserId');
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) throw new Error('No user logged in');
    
    try {
      await database.updateUser(authState.user.id, updates);
      const updatedUser = { ...authState.user, ...updates };
      setAuthState({
        ...authState,
        user: updatedUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile
  };
};