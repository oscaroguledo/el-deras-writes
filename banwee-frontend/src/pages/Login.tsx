import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    login,
    isAuthenticated,
    isAdmin,
    isSupplier
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Get redirect path from URL params or default based on user role
  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) return redirect;
    if (isAdmin) return '/admin';
    if (isSupplier) return '/account/products';
    return '/';
  };
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectPath());
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Login successful!', {
        description: 'Welcome back to Banwee Organics.'
      });
      // Navigate will happen automatically due to the useEffect
    } catch (error) {
      toast.error('Login failed', {
        description: 'Please check your email and password.'
      });
      setLoading(false);
    }
  };
  return <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-main dark:text-white mb-6 text-center">
          Login to Your Account
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Email Address
            </label>
            <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-main dark:text-gray-200">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary pr-10 dark:bg-gray-700 dark:text-white" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} className="text-gray-500 dark:text-gray-400" /> : <Eye size={18} className="text-gray-500 dark:text-gray-400" />}
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="remember" className="mr-2" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
            <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </label>
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-md transition-colors flex justify-center items-center" disabled={loading}>
            {loading ? <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span> : 'Login'}
          </button>
        </form>
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
          <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400 absolute">
            Or continue with
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" className="w-5 h-5 mr-2" alt="Google" />
            Google
          </button>
          <button className="flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" className="w-5 h-5 mr-2" alt="Facebook" />
            Facebook
          </button>
        </div>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>;
};
export default Login;