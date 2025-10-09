import React, { useEffect, useState, createContext, useContext } from 'react';
export type UserRole = 'customer' | 'supplier' | 'admin' | 'superadmin';
export type ThemeMode = 'light' | 'dark' | 'system';
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  preferences?: {
    theme: ThemeMode;
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      telegram: boolean;
    };
  };
}
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  verifyEmail: (code: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  isAdmin: boolean;
  isSupplier: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    // Check local storage for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);
  const login = async (email: string, password: string) => {
    // Mock login functionality
    let role: UserRole = 'customer';
    // For demo purposes, assign roles based on email
    if (email === 'admin@banwee.com' || email === 'admin@example.com') {
      role = 'admin';
    } else if (email === 'supplier@banwee.com') {
      role = 'supplier';
    } else if (email === 'superadmin@banwee.com') {
      role = 'superadmin';
    }
    const mockUser: User = {
      id: 'user123',
      name: email === 'admin@banwee.com' ? 'Admin User' : 'John Doe',
      email: email,
      phone: '+1234567890',
      role: role,
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
          telegram: false
        }
      }
    };
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };
  const register = async (name: string, email: string, password: string, role: UserRole = 'customer') => {
    // Mock registration functionality
    const mockUser: User = {
      id: 'user123',
      name: name,
      email: email,
      role: role,
      preferences: {
        theme: 'system',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false,
          telegram: false
        }
      }
    };
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };
  const verifyEmail = async (code: string) => {
    // Mock email verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (user) {
      const updatedUser = {
        ...user,
        emailVerified: true
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };
  const verifyPhone = async (code: string) => {
    // Mock phone verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (user) {
      const updatedUser = {
        ...user,
        phoneVerified: true
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };
  const updateUserPreferences = async (preferences: Partial<User['preferences']>) => {
    // Mock update user preferences
    await new Promise(resolve => setTimeout(resolve, 500));
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences
        }
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };
  // Helper properties for checking user roles
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSupplier = user?.role === 'supplier';
  return <AuthContext.Provider value={{
    user,
    isAuthenticated,
    login,
    register,
    logout,
    verifyEmail,
    verifyPhone,
    updateUserPreferences,
    isAdmin,
    isSupplier
  }}>
      {children}
    </AuthContext.Provider>;
};