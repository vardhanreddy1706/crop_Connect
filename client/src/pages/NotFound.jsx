import React from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-green-600 dark:text-green-400 mb-4">404</h1>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Looking for something?
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try using the navigation menu or search feature to find what you need.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
