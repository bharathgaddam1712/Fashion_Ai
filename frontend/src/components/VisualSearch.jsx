import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

const VisualSearch = () => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const { token } = useContext(AuthContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSearch = async () => {
    if (!file) return alert('Please upload an image');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/search/visual`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setResults(res.data);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="section">
      <h2>Visual Search</h2>
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleSearch} className="button">Search</button>
      </div>
      {results.length > 0 && (
        <div className="grid">
          {results.map(product => (
            <div key={product.product_id} className="card">
              <img src={`${import.meta.env.VITE_API_URL}/${product.image}`} alt={product.name} />
              <h3>{product.name}</h3>
              <p>Price: ₹{product.price}</p>
              <p>Brand: {product.brand}</p>
              <p>Similarity: {(product.similarity * 100).toFixed(2)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualSearch;