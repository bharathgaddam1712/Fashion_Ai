/**
 * routes/search.js
 */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { extractFeatures } = require('../services/imageFeatureExtractor');
const { searchSimilarImages } = require('../services/vectorSearch');
const { loadProducts } = require('../utils/loadProducts');
const User = require('../models/User');
const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/visual', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Read uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);

    // Extract features
    const features = await extractFeatures(imageBuffer, 'User uploaded image');
    if (!features || features.length !== 768) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Failed to extract image features' });
    }

    // Search similar images
    const results = await searchSimilarImages(features, 5);
    const productIds = results.map(r => r.metadata.product_id);

    // Fetch product metadata from CSV
    const products = await loadProducts();
    const matchedProducts = products.filter(p => productIds.includes(p.product_id));

    // Update user search history
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(userId, {
        $push: { search_history: { product_id: productIds[0], timestamp: new Date() } }
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(matchedProducts.map(product => ({
      ...product,
      similarity: results.find(r => r.metadata.product_id === product.product_id).score
    })));
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userId);
    const productIds = user.search_history.map(h => h.product_id).slice(0, 5);
    
    // Fetch product metadata from CSV
    const products = await loadProducts();
    const matchedProducts = products.filter(p => productIds.includes(p.product_id));
    
    res.json(matchedProducts);
  } catch (err) {
    res.status(500).json({ error: 'Recommendation failed: ' + err.message });
  }
});

module.exports = router;