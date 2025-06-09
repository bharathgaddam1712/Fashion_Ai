import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup ? '/signup' : '/signin';
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth${endpoint}`, { email, password });
      if (!isSignup) {
        setToken(res.data.token);
        navigate('/home');
      } else {
        alert('Signup successful! Please sign in.');
        setIsSignup(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignup ? 'Sign Up' : 'Sign In'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="button">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p className="auth-toggle">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;