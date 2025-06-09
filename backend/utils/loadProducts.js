/**
 * utils/loadProducts.js
 */
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

let productsCache = null;

async function loadProducts() {
  if (productsCache) return productsCache;

  const filePath = path.resolve(__dirname, '../data/fashion_data.csv');
  const products = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        products.push({
          product_id: row.product_id,
          name: row.product_name,
          price: parseFloat(row.selling_price) || 0,
          discount: parseFloat(row.discount) || 0,
          category_id: parseInt(row.category_id) || 0,
          brand: row.brand || 'Unknown',
          launch_on: row.launch_on ? new Date(row.launch_on) : new Date(),
          image: row.feature_image_s3,
          description: row.description || '',
          features: row.meta_info ? row.meta_info.split('.').map(s => s.trim()).filter(s => s) : []
        });
      })
      .on('end', () => {
        productsCache = products;
        resolve(products);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = { loadProducts };