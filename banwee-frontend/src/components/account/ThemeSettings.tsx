import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor, CheckCircle } from 'lucide-react';
export const ThemeSettings: React.FC = () => {
  const {
    theme,
    setTheme
  } = useTheme();
  return <div>
      <h1 className="text-2xl font-bold text-main dark:text-white mb-6">
        Theme Settings
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-main dark:text-white mb-4">
          Choose Theme
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Select your preferred appearance mode for the website.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`border rounded-lg p-4 cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setTheme('light')}>
            <div className="flex justify-between items-center mb-3">
              <Sun size={24} className="text-yellow-500" />
              {theme === 'light' && <CheckCircle size={18} className="text-primary" />}
            </div>
            <h3 className="font-medium text-main dark:text-white">
              Light Mode
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Standard light appearance
            </p>
          </div>
          <div className={`border rounded-lg p-4 cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setTheme('dark')}>
            <div className="flex justify-between items-center mb-3">
              <Moon size={24} className="text-blue-700 dark:text-blue-400" />
              {theme === 'dark' && <CheckCircle size={18} className="text-primary" />}
            </div>
            <h3 className="font-medium text-main dark:text-white">Dark Mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Easier on the eyes in low light
            </p>
          </div>
          <div className={`border rounded-lg p-4 cursor-pointer transition-all ${theme === 'system' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setTheme('system')}>
            <div className="flex justify-between items-center mb-3">
              <Monitor size={24} className="text-gray-700 dark:text-gray-300" />
              {theme === 'system' && <CheckCircle size={18} className="text-primary" />}
            </div>
            <h3 className="font-medium text-main dark:text-white">
              System Default
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Follows your device settings
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-main dark:text-white mb-4">
          About Themes
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          The light theme provides a clean, bright interface that's ideal for
          daytime use. The dark theme reduces eye strain in low-light
          environments and may help save battery on devices with OLED screens.
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          System default automatically switches between light and dark based on
          your device settings, providing a seamless experience that matches
          your operating system preferences.
        </p>
      </div>
    </div>;
};