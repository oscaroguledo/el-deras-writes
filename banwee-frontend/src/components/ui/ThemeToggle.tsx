import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
interface ThemeToggleProps {
  className?: string;
}
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className
}) => {
  const {
    theme,
    setTheme
  } = useTheme();
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  return <button onClick={toggleTheme} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`} aria-label="Toggle theme">
      {theme === 'light' && <Sun size={20} />}
      {theme === 'dark' && <Moon size={20} />}
      {theme === 'system' && <Monitor size={20} />}
    </button>;
};