import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeContextType {
  theme: ThemeMode;
  currentTheme: 'light' | 'dark'; // The actual theme being applied
  setTheme: (theme: ThemeMode) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const {
    user,
    updateUserPreferences
  } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (user?.preferences?.theme) {
      setThemeState(user.preferences.theme);
    } else if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, [user]);
  // Apply theme changes
  useEffect(() => {
    // Save theme preference
    localStorage.setItem('theme', theme);
    // Determine the actual theme to apply
    let newTheme: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      newTheme = prefersDark ? 'dark' : 'light';
    } else {
      newTheme = theme as 'light' | 'dark';
    }
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setCurrentTheme(newTheme);
  }, [theme]);
  // Listen for system theme changes if using system preference
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      setCurrentTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    // Update user preferences if authenticated
    if (user) {
      try {
        await updateUserPreferences({
          theme: newTheme
        });
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    }
  };
  return <ThemeContext.Provider value={{
    theme,
    currentTheme,
    setTheme
  }}>
      {children}
    </ThemeContext.Provider>;
};