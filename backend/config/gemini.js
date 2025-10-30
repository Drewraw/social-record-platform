const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini model
const getModel = (modelName = 'gemini-pro') => {
  return genAI.getGenerativeModel({ model: modelName });
};

// Generate content using Gemini
const generateContent = async (prompt) => {
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
};

// Analyze official's statements
const analyzeStatement = async (statement) => {
  const prompt = `Analyze the following political statement for clarity, feasibility, and potential impact. Provide a brief analysis:

Statement: "${statement}"

Analysis:`;
  
  return await generateContent(prompt);
};

// Generate summary of promises
const summarizePromises = async (promises) => {
  const promisesList = promises.map((p, i) => `${i + 1}. ${p.title} (Status: ${p.status})`).join('\n');
  
  const prompt = `Summarize the following promises made by an elected official. Provide insights on overall performance and areas of concern:

Promises:
${promisesList}

Summary:`;
  
  return await generateContent(prompt);
};

// Compare statement with reality
const compareWithReality = async (statement, reality) => {
  const prompt = `Compare the following political statement with the ground reality. Provide an objective analysis:

Statement: "${statement}"
Reality: "${reality}"

Analysis:`;
  
  return await generateContent(prompt);
};

module.exports = {
  getModel,
  generateContent,
  analyzeStatement,
  summarizePromises,
  compareWithReality,
};
