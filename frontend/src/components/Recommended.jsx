import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Recommended = () => {
  const [products, setProducts] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      }
    };
    if (token) fetchRecommendations();
  }, [token]);

  if (!products.length) return null;

  return (
    <div className="section">
      <h2>Recommended for You</h2>
      <div className="grid">
        {products.map(product => (
          <div key={product.product_id} className="card">
            <img src={`${import.meta.env.VITE_API_URL}/${product.image}`} alt={product.name} />
            <h3>{product.name}</h3>
            <p>Price: ₹{product.price}</p>
            <p>Brand: {product.brand}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommended;