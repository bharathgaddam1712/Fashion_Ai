const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  search_history: [{ product_id: String, timestamp: Date }],
});

module.exports = mongoose.model('User', UserSchema);