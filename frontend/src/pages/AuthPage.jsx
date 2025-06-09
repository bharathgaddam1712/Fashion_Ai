import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import Auth from '../components/Auth.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

const AuthPage = () => {
  const { token } = useContext(AuthContext);
  if (token) return <Navigate to="/home" />;
  return <Auth />;
};

export default AuthPage;