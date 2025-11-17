import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  requirePasswordChange: false
};


const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_PASSWORD_CHANGE_REQUIRED: 'SET_PASSWORD_CHANGE_REQUIRED',
  PASSWORD_CHANGE_COMPLETED: 'PASSWORD_CHANGE_COMPLETED'
};


const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
        requirePasswordChange: action.payload.requirePasswordChange || false
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case AUTH_ACTIONS.SET_PASSWORD_CHANGE_REQUIRED:
      return {
        ...state,
        requirePasswordChange: action.payload
      };
    case AUTH_ACTIONS.PASSWORD_CHANGE_COMPLETED:
      return {
        ...state,
        requirePasswordChange: false,
        user: { ...state.user, firstLogin: false, mustChangePassword: false }
      };
    default:
      return state;
  }
};


const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = authService.getStoredUser();

      if (token && storedUser) {
        try {
          const response = await authService.getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token
            }
          });
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await authService.login(credentials);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          ...response.data,
          requirePasswordChange: response.data.requirePasswordChange || false
        }
      });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };



  const logout = async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  // ADD PASSWORD RESET FUNCTIONS
  const forgotPassword = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await authService.forgotPassword(credentials);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Password reset failed'
      });
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await authService.resetPassword(token, newPassword);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Password reset failed'
      });
      throw error;
    }
  };

  const firstLoginChangePassword = async (passwordData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await authService.firstLoginChangePassword(passwordData);
      dispatch({ type: AUTH_ACTIONS.PASSWORD_CHANGE_COMPLETED });
      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Password change failed'
      });
      throw error;
    }
  };

  const updateAuthAfterPasswordChange = (token, user) => {
    // Store new token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update the auth state
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: {
        token,
        user,
        requirePasswordChange: false
      }
    });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    // ADD PASSWORD RESET FUNCTIONS TO CONTEXT VALUE
    forgotPassword,
    resetPassword,
    firstLoginChangePassword,
    updateAuthAfterPasswordChange
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};