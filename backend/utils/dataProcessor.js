// /**
//  * utils/dataProcessor.js
//  */
// require('dotenv').config();
// const csv = require('csv-parser');
// const fs = require('fs');
// const path = require('path');
// const Product = require('../models/Product');
// const { extractFeatures } = require('../services/imageFeatureExtractor');
// const { initPinecone } = require('./initPinecone');

// async function processCSV(filePath) {
//   console.log('Starting CSV processing at:', new Date().toISOString());

//   // Validate environment variables
//   if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
//     console.error('Error: Missing PINECONE_API_KEY or GEMINI_API_KEY in .env');
//     process.exit(1);
//   }

//   // Initialize Pinecone
//   console.log('Initializing Pinecone client...');
//   const index = await initPinecone();
//   console.log('Pinecone index ready: fashion-images');
//   await new Promise(resolve => setTimeout(resolve, 5000));

//   // Resolve file path
//   const absolutePath = path.resolve(filePath);
//   if (!fs.existsSync(absolutePath)) {
//     console.error(`Error: File not found at ${absolutePath}`);
//     process.exit(1);
//   }
//   console.log(`Reading CSV file: ${absolutePath}`);

//   const products = [];
//   let rowCount = 0;
//   let upsertedCount = 0;
//   let skippedCount = 0;

//   // Read CSV rows synchronously
//   const rows = [];
//   await new Promise((resolve, reject) => {
//     fs.createReadStream(absolutePath)
//       .pipe(csv())
//       .on('data', (row) => rows.push(row))
//       .on('end', () => {
//         console.log(`Read ${rows.length} rows from CSV`);
//         resolve();
//       })
//       .on('error', (err) => {
//         console.error(`CSV stream error: ${err.message}`);
//         reject(err);
//       });
//   });

//   // Process rows
//   for (const row of rows) {
//     rowCount++;
//     console.log(`Processing row ${rowCount}: ${row.product_id || 'unknown'}`);
//     try {
//       // Validate required columns
//       if (!row.product_id) {
//         console.warn(`Skipping row ${rowCount}: Missing product_id`);
//         skippedCount++;
//         continue;
//       }
//       if (!row.product_name) {
//         console.warn(`Skipping row ${rowCount}: Missing product_name`);
//         skippedCount++;
//         continue;
//       }
//       if (!row.feature_image_s3) {
//         console.warn(`Skipping row ${rowCount}: Missing feature_image_s3`);
//         skippedCount++;
//         continue;
//       }

//       // Validate image file exists
//       const imagePath = path.resolve(row.feature_image_s3);
//       if (!fs.existsSync(imagePath)) {
//         console.warn(`Skipping row ${rowCount}: Image file not found at ${imagePath}`);
//         skippedCount++;
//         continue;
//       }

//       // Parse selling_price (numeric)
//       let price = 0;
//       try {
//         if (row.selling_price) {
//           price = parseFloat(row.selling_price) || 0;
//           console.log(`Row ${rowCount}: Parsed selling_price: ${price}`);
//         }
//       } catch (err) {
//         console.warn(`Row ${rowCount}: Failed to parse selling_price: ${row.selling_price}. Error: ${err.message}`);
//       }

//       // Derive feature_list from meta_info
//       let featuresList = [];
//       try {
//         if (row.meta_info) {
//           featuresList = row.meta_info.split('.').map(s => s.trim()).filter(s => s);
//           console.log(`Row ${rowCount}: Derived feature_list: ${featuresList.length} items`);
//         }
//       } catch (err) {
//         console.warn(`Row ${rowCount}: Failed to derive feature_list from meta_info: ${row.meta_info}. Error: ${err.message}`);
//       }

//       // Read image
//       console.log(`Reading image for ${row.product_id}: ${imagePath}`);
//       const imageBuffer = fs.readFileSync(imagePath);

//       // Extract features
//       let features = null;
//       let retries = 3;
//       while (retries--) {
//         try {
//           console.log(`Extracting embedding for ${row.product_id}`);
//           features = await extractFeatures(imageBuffer, row.description || row.product_name);
//           if (features && features.length === 768) {
//             break;
//           }
//           console.warn(`Retry ${3 - retries}: Invalid embedding for ${row.product_id} (length: ${features?.length || 'undefined'})`);
//         } catch (err) {
//           console.warn(`Retry ${3 - retries}: Embedding extraction failed: ${err.message}`);
//           if (retries === 0) {
//             throw err;
//           }
//         }
//       }

//       if (!features || features.length !== 768) {
//         console.warn(`Skipping row ${rowCount}: Invalid embedding for ${row.product_id} (length: ${features?.length || 'undefined'})`);
//         skippedCount++;
//         continue;
//       }

//       // Upsert to Pinecone with retry
//       let upsertSuccess = false;
//       retries = 3;
//       while (!upsertSuccess && retries--) {
//         try {
//           console.log(`Upserting vector for ${rowCount}: ${row.product_id} (attempt ${3 - retries})`);
//           await index.upsert([{
//             id: row.product_id,
//             values: features,
//             metadata: { product_id: row.product_id }
//           }]);
//           upsertSuccess = true;
//           upsertedCount++;
//           console.log(`Upserted vector ${upsertedCount} for ${row.product_id}`);
//         } catch (err) {
//           console.warn(`Retry ${3 - retries}: Pinecone upsert failed: ${err.message}`);
//           if (retries === 0) {
//             throw err;
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }
//       }

//       // Verify Pinecone insertion
//       const stats = await index.describeIndexStats();
//       console.log(`Current Pinecone vector count: ${stats.totalRecordCount || 0}`);

//       // Add to MongoDB products
//       products.push({
//         product_id: row.product_id,
//         name: row.product_name,
//         price: price,
//         discount: parseFloat(row.discount) || 0,
//         category_id: parseInt(row.category_id) || 0,
//         brand: row.brand || 'Unknown',
//         launch_on: row.launch_on ? new Date(row.launch_on) : new Date(),
//         image: row.feature_image_s3,
//         description: row.description || '',
//         features: featuresList
//       });
//     } catch (err) {
//       console.error(`Error processing row ${rowCount} (${row.product_id || 'unknown'}): ${err.message}`);
//       skippedCount++;
//     }
//   }

//   // Finalize
//   try {
//     console.log(`Inserting ${products.length} products into MongoDB...`);
//     if (products.length > 0) {
//       await Product.insertMany(products, { ordered: false });
//       console.log(`Inserted ${products.length} products into MongoDB`);
//     } else {
//       console.warn('No products to insert into MongoDB');
//     }

//     console.log(`Total rows processed: ${rowCount}`);
//     console.log(`Total vectors upserted to Pinecone: ${upsertedCount}`);
//     console.log(`Total rows skipped: ${skippedCount}`);

//     // Final Pinecone verification
//     console.log('Verifying Pinecone data...');
//     const stats = await index.describeIndexStats();
//     console.log('Pinecone index stats:', JSON.stringify(stats, null, 2));

//     console.log('Data processing complete:', new Date().toISOString());
//   } catch (err) {
//     console.error(`Error finalizing processing: ${err.message}`);
//     process.exit(1);
//   }
// }

// // Run if called directly
// if (require.main === module) {
//   const filePath = process.argv[2];
//   if (!filePath) {
//     console.error('Error: No file path provided');
//     console.error('Usage: node utils/dataProcessor.js <path_to_csv>');
//     process.exit(1);
//   }
//   processCSV(filePath).catch(err => {
//     console.error('Processing failed:', err.message);
//     process.exit(1);
//   });
// }

// module.exports = { processCSV };









/**
 * utils/dataProcessor.js
 */
require('dotenv').config();
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { extractFeatures } = require('../services/imageFeatureExtractor');
const { initPinecone } = require('./initPinecone');

async function processCSV(filePath) {
  console.log('Starting CSV processing at:', new Date().toISOString());

  // Validate environment variables
  if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
    console.error('Error: Missing PINECONE_API_KEY or GEMINI_API_KEY in .env');
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/fashion_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
  console.log('MongoDB connected');

  // Initialize Pinecone
  console.log('Initializing Pinecone client...');
  const index = await initPinecone();
  console.log('Pinecone index ready: fashion-images');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Resolve file path
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`);
    process.exit(1);
  }
  console.log(`Reading CSV file: ${absolutePath}`);

  const products = [];
  let rowCount = 0;
  let upsertedCount = 0;
  let skippedCount = 0;

  // Read CSV rows synchronously
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        console.log(`Read ${rows.length} rows from CSV`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`CSV stream error: ${err.message}`);
        reject(err);
      });
  });

  // Process rows
  for (const row of rows) {
    rowCount++;
    console.log(`Processing row ${rowCount}: ${row.product_id || 'unknown'}`);
    try {
      // Validate required columns
      if (!row.product_id) {
        console.warn(`Skipping row ${rowCount}: Missing product_id`);
        skippedCount++;
        continue;
      }
      if (!row.product_name) {
        console.warn(`Skipping row ${rowCount}: Missing product_name`);
        skippedCount++;
        continue;
      }
      if (!row.feature_image_s3) {
        console.warn(`Skipping row ${rowCount}: Missing feature_image_s3`);
        skippedCount++;
        continue;
      }

      // Validate image file exists
      const imagePath = path.resolve(row.feature_image_s3);
      if (!fs.existsSync(imagePath)) {
        console.warn(`Skipping row ${rowCount}: Image file not found at ${imagePath}`);
        skippedCount++;
        continue;
      }

      // Parse selling_price (numeric)
      let price = 0;
      try {
        if (row.selling_price) {
          price = parseFloat(row.selling_price) || 0;
          console.log(`Row ${rowCount}: Parsed selling_price: ${price}`);
        }
      } catch (err) {
        console.warn(`Row ${rowCount}: Failed to parse selling_price: ${row.selling_price}. Error: ${err.message}`);
      }

      // Derive feature_list from meta_info
      let featuresList = [];
      try {
        if (row.meta_info) {
          featuresList = row.meta_info.split('.').map(s => s.trim()).filter(s => s);
          console.log(`Row ${rowCount}: Derived feature_list: ${featuresList.length} items`);
        }
      } catch (err) {
        console.warn(`Row ${rowCount}: Failed to derive feature_list from meta_info: ${row.meta_info}. Error: ${err.message}`);
      }

      // Read image
      console.log(`Reading image for ${row.product_id}: ${imagePath}`);
      const imageBuffer = fs.readFileSync(imagePath);

      // Extract features
      let features = null;
      let retries = 3;
      while (retries--) {
        try {
          console.log(`Extracting embedding for ${row.product_id}`);
          features = await extractFeatures(imageBuffer, row.description || row.product_name);
          if (features && features.length === 768) {
            break;
          }
          console.warn(`Retry ${3 - retries}: Invalid embedding for ${row.product_id} (length: ${features?.length || 'undefined'})`);
        } catch (err) {
          console.warn(`Retry ${3 - retries}: Embedding extraction failed: ${err.message}`);
          if (retries === 0) {
            throw err;
          }
        }
      }

      if (!features || features.length !== 768) {
        console.warn(`Skipping row ${rowCount}: Invalid embedding for ${row.product_id} (length: ${features?.length || 'undefined'})`);
        skippedCount++;
        continue;
      }

      // Upsert to Pinecone with retry
      let upsertSuccess = false;
      retries = 3;
      while (!upsertSuccess && retries--) {
        try {
          console.log(`Upserting vector for ${rowCount}: ${row.product_id} (attempt ${3 - retries})`);
          await index.upsert([{
            id: row.product_id,
            values: features,
            metadata: { product_id: row.product_id }
          }]);
          upsertSuccess = true;
          upsertedCount++;
          console.log(`Upserted vector ${upsertedCount} for ${row.product_id}`);
        } catch (err) {
          console.warn(`Retry ${3 - retries}: Pinecone upsert failed: ${err.message}`);
          if (retries === 0) {
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Verify Pinecone insertion
      const stats = await index.describeIndexStats();
      console.log(`Current Pinecone vector count: ${stats.totalRecordCount || 0}`);

      // Add to MongoDB products
      products.push({
        product_id: row.product_id,
        name: row.product_name,
        price: price,
        discount: parseFloat(row.discount) || 0,
        category_id: parseInt(row.category_id) || 0,
        brand: row.brand || 'Unknown',
        launch_on: row.launch_on ? new Date(row.launch_on) : new Date(),
        image: row.feature_image_s3,
        description: row.description || '',
        features: featuresList
      });
    } catch (err) {
      console.error(`Error processing row ${rowCount} (${row.product_id || 'unknown'}): ${err.message}`);
      skippedCount++;
    }
  }

  // Insert into MongoDB with error handling
  try {
    console.log(`Inserting ${products.length} products into MongoDB...`);
    if (products.length > 0) {
      // Clear existing products to avoid duplicates
      await Product.deleteMany({});
      console.log('Cleared existing products in MongoDB');
      
      // Insert new products
      const result = await Product.insertMany(products, { ordered: false });
      console.log(`Inserted ${result.length} products into MongoDB`);
    } else {
      console.warn('No products to insert into MongoDB');
    }

    console.log(`Total rows processed: ${rowCount}`);
    console.log(`Total vectors upserted to Pinecone: ${upsertedCount}`);
    console.log(`Total rows skipped: ${skippedCount}`);

    // Final Pinecone verification
    console.log('Verifying Pinecone data...');
    const stats = await index.describeIndexStats();
    console.log('Pinecone index stats:', JSON.stringify(stats, null, 2));

    console.log('Data processing complete:', new Date().toISOString());
  } catch (err) {
    console.error(`Error finalizing processing: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Error: No file path provided');
    console.error('Usage: node utils/dataProcessor.js <path_to_csv>');
    process.exit(1);
  }
  processCSV(filePath).catch(err => {
    console.error('Processing failed:', err.message);
    process.exit(1);
  });
}

module.exports = { processCSV };