import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
          params: { sort, year }
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, [sort, year]);

  return (
    <div className="section">
      <h2>Browse Products</h2>
      <div className="filters">
        <select onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort By</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="discount">Discount</option>
        </select>
        <select onChange={(e) => setYear(e.target.value)}>
          <option value="">All Years</option>
          <option value="2020">2020</option>
          <option value="2025">2025</option>
        </select>
      </div>
      <div className="grid">
        {products.map(product => (
          <div key={product.product_id} className="card">
            <img src={`${import.meta.env.VITE_API_URL}/${product.image}`} alt={product.name} />
            <h3>{product.name}</h3>
            <p>Price: ₹{product.price}</p>
            <p>Discount: {product.discount}%</p>
            <p>Brand: {product.brand}</p>
            <p>Launch: {new Date(product.launch_on).getFullYear()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;