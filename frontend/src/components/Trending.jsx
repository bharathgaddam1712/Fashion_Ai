import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Trending = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/trending`);
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching trending products:', err);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="section">
      <h2>Trending Products (2025)</h2>
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

export default Trending;