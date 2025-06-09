/**
 * server.js
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { initPinecone } = require('./utils/initPinecone');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const searchRoutes = require('./routes/search');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// MongoDB connection (for user data only)
mongoose.connect('mongodb://localhost:27017/fashion_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initialize Pinecone
initPinecone()
  .then(() => console.log('Pinecone connected'))
  .catch(err => console.error('Pinecone connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));