import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        localStorage.setItem('token', token);
      } catch (err) {
        setToken('');
        setUser(null);
        localStorage.removeItem('token');
      }
    }
  }, [token]);

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};