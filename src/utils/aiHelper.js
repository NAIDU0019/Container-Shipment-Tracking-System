import { OpenAI } from 'openai';
import { config } from '../config/env.js';

const openai = new OpenAI(config.OPENAI_API_KEY);

export const generateResponse = async (prompt, context = '') => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for a container logistics platform."
        },
        {
          role: "user",
          content: `${context}\n\n${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};

export const analyzeShippingDocument = async (documentText) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Extract and analyze key information from shipping documents."
        },
        {
          role: "user",
          content: documentText
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return {
      analysis: completion.choices[0].message.content,
      confidence: calculateConfidence(completion)
    };
  } catch (error) {
    console.error('Document Analysis Error:', error);
    throw new Error('Failed to analyze document');
  }
};

const calculateConfidence = (completion) => {
  // Simple confidence calculation based on response
  return completion.choices[0].finish_reason === 'stop' ? 'high' : 'medium';
};