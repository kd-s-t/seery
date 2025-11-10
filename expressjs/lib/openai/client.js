const OpenAI = require('openai');
require('dotenv').config();

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function checkOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set. AI features will be disabled.');
    console.warn('💡 To enable AI features, add OPENAI_API_KEY to your .env file');
    console.warn('💡 Free tier options: Use gpt-3.5-turbo (cheapest) or leave empty for manual resolution');
    return false;
  }
  return true;
}

module.exports = {
  getOpenAIClient,
  checkOpenAI
};

