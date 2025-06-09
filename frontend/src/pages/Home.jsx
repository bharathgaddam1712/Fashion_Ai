import React, { useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import ProductList from '../components/ProductList.jsx';
import VisualSearch from '../components/VisualSearch.jsx';
import Trending from '../components/Trending.jsx';
import Recommended from '../components/Recommended.jsx';

const Home = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!token) return <Navigate to="/auth" />;

  return (
    <div>
      <header className="header">
        <h1>Fashion Visual Search</h1>
        <button onClick={() => { logout(); navigate('/auth'); }} className="button logout-button">
          Logout
        </button>
      </header>
      <main className="container">
        <VisualSearch />
        <Recommended />
        <ProductList />
        <Trending />
      </main>
    </div>
  );
};

export default Home;