const { GoogleGenAI, Type } = require("@google/genai");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageData } = JSON.parse(event.body);
    if (!imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data' }) };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable not set.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: API key is missing.' }) };
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
        },
    };

    const textPart = {
        text: "Count the total number of people visible in this classroom image.",
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              count: {
                type: Type.INTEGER,
                description: 'The total number of people detected in the image.'
              }
            }
          }
        }
    });

    const result = JSON.parse(response.text);
    const count = result.count;
    
    if (typeof count !== 'number') {
        console.error(AI returned unexpected JSON structure: ${JSON.stringify(result)});
        throw new Error('AI analysis returned an invalid data structure.');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    };

  } catch (error) {
    console.error("Error in analyzeImage function:", error);
    return { statusCode: 500, body: JSON.stringify({ error: An internal server error occurred: ${error.message} }) };
  }
};
