import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from 'express-async-handler';
import { config } from '../config/env.js';

const genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);

// @desc    Get AI assistance
// @route   POST /api/ai/assist
// @access  Private
export const getAIAssistance = asyncHandler(async (req, res) => {
  const { query } = req.body;

  // For text-only input
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `As a logistics expert, please help with the following query: ${query}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  res.json({
    response: response.text()
  });
});

// @desc    Analyze document
// @route   POST /api/ai/analyze-document
// @access  Private
export const analyzeDocument = asyncHandler(async (req, res) => {
  const { documentText } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Analyze this shipping document and extract key information: ${documentText}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;

  res.json({
    analysis: response.text()
  });
});