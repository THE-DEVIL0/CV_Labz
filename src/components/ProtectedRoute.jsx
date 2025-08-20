import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading, sessionChecked } = useSession();
  const location = useLocation();

  // Show loading state while checking session
  if (isLoading || !sessionChecked) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute; 