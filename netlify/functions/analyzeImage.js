const { GoogleGenAI } = require('@google/genai');

exports.handler = async function (event) {
  // We only accept POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the API key from the secure environment variables on Netlify
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Get the image data from the request body
    const { imageData } = JSON.parse(event.body);
    if (!imageData) {
        return { statusCode: 400, body: 'imageData is required.' };
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    };
    const textPart = { text: 'Count the number of people in this image. Respond with only a single integer number.' };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: response.text }),
    };

  } catch (error) {
    console.error('Error in analyzeImage function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};