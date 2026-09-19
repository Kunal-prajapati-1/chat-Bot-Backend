const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateContent(content) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: content,
  });

  return response.text;
}

async function generateEmbeddings(content) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: content,
    config: {
      outputDimensionality: 768,
    },
  });

  return response.embeddings[0].values;
}

module.exports = {
  generateContent,
  generateEmbeddings,
};