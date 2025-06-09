/**
 * services/vectorSearch.js
 */
const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index('fashion-images');

async function searchSimilarImages(features, topK = 5) {
  try {
    const queryResponse = await index.query({
      vector: features,
      topK,
      includeMetadata: true
    });
    return queryResponse.matches;
  } catch (err) {
    console.error('Vector search error:', err.message);
    throw err;
  }
}

module.exports = { searchSimilarImages };