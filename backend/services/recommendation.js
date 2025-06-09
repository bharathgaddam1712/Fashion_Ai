const Product = require('../models/Product');
const User = require('../models/User');

async function getRecommendations(userId) {
  try {
    const user = await User.findById(userId);
    const productIds = user.search_history.map(h => h.product_id).slice(0, 5);
    const products = await Product.find({ product_id: { $in: productIds } });
    return products;
  } catch (err) {
    console.error('Recommendation error:', err);
    return [];
  }
}

module.exports = { getRecommendations };
