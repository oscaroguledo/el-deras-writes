import React from 'react';
import { Link, useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: any;
}

const ErrorPage: React.FC = () => {
  const error = useRouteError() as RouteError;
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Determine error type and message
  const getErrorInfo = () => {
    if (error?.status === 404) {
      return {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        showReload: false
      };
    } else if (error?.status === 500) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        showReload: true
      };
    } else if (error?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        showReload: false
      };
    } else {
      return {
        title: 'Something went wrong',
        message: error?.message || error?.statusText || 'An unexpected error occurred.',
        showReload: true
      };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-12 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <AlertTriangle className="mx-auto h-20 w-20 text-red-500 mb-4" />
              {error?.status && (
                <div className="text-6xl font-bold text-gray-300 mb-2">
                  {error.status}
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {errorInfo.message}
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </Link>
              
              {errorInfo.showReload && (
                <button
                  onClick={handleReload}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If this problem persists, please{' '}
                <Link 
                  to="/contact" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;