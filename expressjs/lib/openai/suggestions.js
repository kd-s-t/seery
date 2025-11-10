const { getOpenAIClient } = require('./client');
const cache = require('./cache');

async function generatePriceSuggestion(crypto) {
  const cached = cache.get('generatePriceSuggestion', crypto.symbol, crypto.price);
  if (cached) {
    return cached;
  }
  
  const openai = getOpenAIClient();
  
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const prompt = `Analyze the current state of ${crypto.name} (${crypto.symbol}).

Current Price: $${crypto.price.toFixed(2)}
24h Change: ${crypto.change24h > 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%

Based on recent news, market trends, whale movements, and technical analysis, predict how much the price will change in the next 24-48 hours.

Consider:
- Recent news and developments
- Large wallet movements (whale deposits/withdrawals)
- Market sentiment
- Technical indicators
- Trading volume patterns

Return JSON with this structure:
{
  "direction": "up" or "down",
  "percentChange": 5.2,
  "reasoning": "Brief explanation of why this prediction (2-3 sentences)"
}

Be realistic. Percent changes should typically be between -15% and +15% for 24-48 hour predictions.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto market analyst. Provide realistic price predictions based on news, whale movements, and market analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    const result = {
      direction: suggestion.direction || 'neutral',
      percentChange: parseFloat(suggestion.percentChange) || 0,
      reasoning: suggestion.reasoning || 'Analysis in progress'
    };
    
    cache.set('generatePriceSuggestion', result, crypto.symbol, crypto.price);
    return result;
  } catch (error) {
    console.error('Error generating price suggestion:', error);
    throw error;
  }
}

module.exports = {
  generatePriceSuggestion
};

