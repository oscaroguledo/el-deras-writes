import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-12 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <div className="text-center">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
              <div className="relative">
                <Search className="mx-auto h-16 w-16 text-gray-400" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Sorry, we couldn't find the page you're looking for. 
              The page might have been moved, deleted, or you entered the wrong URL.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </Link>
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link 
                  to="/" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;