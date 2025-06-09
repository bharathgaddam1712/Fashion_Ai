/**
 * models/Product.js
 */
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  category_id: { type: Number, default: 0 }, // Default to 0 if missing
  brand: { type: String, required: true },
  launch_on: { type: Date, required: true },
  image: { type: String, required: true },
  description: { type: String },
  features: [{ type: String }],
});

module.exports = mongoose.model('Product', ProductSchema);