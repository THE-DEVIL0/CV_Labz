import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_USER: 'CLEAR_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionChecked: false,
};

// Reducer function
const sessionReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionChecked: true,
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        sessionChecked: true,
      };
    case ACTIONS.CLEAR_USER:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionChecked: true,
      };
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const SessionContext = createContext();

// Custom hook to use session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Session Provider component
export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Check if user is authenticated
  const checkSession = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const { data } = await apiService.checkSession();
      
      if (data.authenticated && data.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: data.user });
      } else {
        dispatch({ type: ACTIONS.CLEAR_USER });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Don't set error for session check failures, just clear user
      dispatch({ type: ACTIONS.CLEAR_USER });
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const { data } = await apiService.login(credentials);
      
      if (data.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: data.user });
        return { success: true, data };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const { data } = await apiService.register(userData);
      
      if (data.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: data.user });
        return { success: true, data };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      await apiService.logout();
      dispatch({ type: ACTIONS.CLEAR_USER });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      dispatch({ type: ACTIONS.CLEAR_USER });
      return { success: true };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  // Refresh session
  const refreshSession = () => {
    checkSession();
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    sessionChecked: state.sessionChecked,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    refreshSession,
    checkSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}; 