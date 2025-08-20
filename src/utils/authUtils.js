// Utility functions for authentication

export const getRedirectPath = (location) => {
  // Get the path the user was trying to access
  const from = location?.state?.from?.pathname;
  
  // If they were trying to access a specific page, redirect there
  if (from && from !== '/login' && from !== '/register') {
    return from;
  }
  
  // Otherwise, redirect to home
  return '/';
};

export const isProtectedRoute = (pathname) => {
  const protectedRoutes = ['/prompt', '/agent1', '/agent2', '/agent3', '/agent4'];
  return protectedRoutes.includes(pathname);
};

export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const validateCredentials = (credentials) => {
  const errors = {};
  
  if (!credentials.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!credentials.password) {
    errors.password = 'Password is required';
  } else if (credentials.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 