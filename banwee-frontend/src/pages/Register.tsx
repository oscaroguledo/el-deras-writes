import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { toast } from 'sonner';
export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserRole>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
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
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      toast.error('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    try {
      setLoading(true);
      await register(name, email, password, userType);
      toast.success('Registration successful!', {
        description: 'Welcome to Banwee Organics.'
      });
      // Navigate will happen automatically due to the useEffect
    } catch (error) {
      toast.error('Registration failed', {
        description: 'Please try again with different credentials.'
      });
      setLoading(false);
    }
  };
  const userTypeOptions = [{
    value: 'customer',
    label: 'Customer',
    description: 'Shop for organic products'
  }, {
    value: 'supplier',
    label: 'Supplier',
    description: 'Sell your products on our platform'
  }];
  // For demo purposes, allow admin registration
  // In a real app, admin accounts would be created through a separate process
  const isDevEnvironment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  if (isDevEnvironment) {
    userTypeOptions.push({
      value: 'admin',
      label: 'Admin',
      description: 'Manage the platform (demo only)'
    }, {
      value: 'superadmin',
      label: 'Super Admin',
      description: 'Full access to all features (demo only)'
    });
  }
  return <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-main dark:text-white mb-6 text-center">
          Create an Account
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Full Name
            </label>
            <input type="text" id="name" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Email Address
            </label>
            <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-white" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {userTypeOptions.map(option => <div key={option.value} onClick={() => setUserType(option.value as UserRole)} className={`border rounded-lg p-3 cursor-pointer transition-all ${userType === option.value ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-main dark:text-white">
                      {option.label}
                    </h3>
                    {userType === option.value && <CheckCircle size={16} className="text-primary" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>)}
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary pr-10 dark:bg-gray-700 dark:text-white" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} className="text-gray-500 dark:text-gray-400" /> : <Eye size={18} className="text-gray-500 dark:text-gray-400" />}
              </button>
            </div>
            <div className="mt-1">
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${password.length === 0 ? 'w-0' : password.length < 6 ? 'w-1/4 bg-red-500' : password.length < 8 ? 'w-2/4 bg-yellow-500' : password.length < 10 ? 'w-3/4 bg-blue-500' : 'w-full bg-green-500'}`}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password should be at least 8 characters
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-main dark:text-gray-200 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary pr-10 dark:bg-gray-700 dark:text-white" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} className="text-gray-500 dark:text-gray-400" /> : <Eye size={18} className="text-gray-500 dark:text-gray-400" />}
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="terms" className="mr-2" checked={acceptTerms} onChange={() => setAcceptTerms(!acceptTerms)} required />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-md transition-colors flex justify-center items-center" disabled={loading}>
            {loading ? <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span> : 'Create Account'}
          </button>
        </form>
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
          <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400 absolute">
            Or sign up with
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
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>;
};
export default Register;