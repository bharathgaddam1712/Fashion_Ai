/**
 * services/imageFeatureExtractor.js
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function extractFeatures(imageBuffer, text) {
  try {
    console.log(`Processing image and text: ${text.slice(0, 100)}...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Convert image to base64
    const imageBase64 = imageBuffer.toString('base64');

    // Analyze image with Gemini
    const prompt = `Describe the style, color, texture, and design elements of the fashion item in this image, combining details with this description: "${text}"`;
    const visionResult = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      }
    ]);
    const candidates = visionResult.response.candidates;
    const enhancedDescription = candidates && candidates[0] && candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0] && candidates[0].content.parts[0].text 
      ? candidates[0].content.parts[0].text.trim() 
      : text;
    console.log(`Enhanced description: ${enhancedDescription.slice(0, 100)}...`);

    // Generate embedding
    console.log('Generating embedding...');
    const embeddingResult = await embeddingModel.embedContent(enhancedDescription);
    const embedding = embeddingResult.embedding.values;
    if (!embedding || embedding.length !== 768) {
      throw new Error(`Invalid embedding dimension: ${embedding?.length || 'undefined'}`);
    }

    console.log(`Generated embedding with length: ${embedding.length}`);
    return embedding;
  } catch (err) {
    console.error('Embedding extraction error:', err.message);
    // Fallback to mock embedding
    console.log('Using mock embedding as fallback...');
    const mockEmbedding = Array(768).fill(0).map(() => Math.random());
    return mockEmbedding;
  }
}

module.exports = { extractFeatures };