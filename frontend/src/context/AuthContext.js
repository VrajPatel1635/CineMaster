// src/context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Create a context for authentication
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores current user object
  const [token, setToken] = useState(null); // Stores the authentication token
  const [authLoading, setAuthLoading] = useState(true); // Tracks loading state

  // Load user and token from localStorage on first mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); // Get stored token

    if (storedUser && storedUser !== 'undefined' && storedToken && storedToken !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken); // Set the token state
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Error parsing stored user or token:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }

    setAuthLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      const { user, token: receivedToken } = res.data; // Destructure token as receivedToken to avoid name conflict

      setUser(user);
      setToken(receivedToken); // Set the token state
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', receivedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  // Signup function
  const signup = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/register', { email, password });
      const { user, token: receivedToken } = res.data; // Destructure token as receivedToken

      setUser(user);
      setToken(receivedToken); // Set the token state
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', receivedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
      return { success: true };
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Signup failed' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null); // Clear the token state
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // <--- Added token here!
        isAuthenticated,
        login,
        signup,
        logout,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext values
export const useAuth = () => useContext(AuthContext);
