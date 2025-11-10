const { getOpenAIClient } = require('./client');
const cache = require('./cache');

async function suggestMarketResolution(marketId, question, outcomes, context = '') {
  const cached = cache.get('suggestMarketResolution', marketId, question);
  if (cached) {
    return cached;
  }
  
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured. AI features are disabled.');
  }
  
  try {
    const prompt = `You are an AI oracle for a prediction market. Analyze the following market and suggest the winning outcome.

Market Question: ${question}
Possible Outcomes: ${outcomes.join(', ')}

${context ? `Additional Context: ${context}` : ''}

Based on current information, news, and verifiable facts, determine which outcome should win.

Return JSON with this structure:
{
  "suggestedOutcome": 0,
  "confidence": 0.85,
  "reasoning": "Detailed explanation of why this outcome should win based on verifiable facts",
  "evidence": ["Fact 1", "Fact 2", "Fact 3"],
  "verificationMethod": "How this can be verified objectively"
}

Confidence should be 0-1, where:
- 0.9-1.0: Very high confidence, outcome is clearly verifiable
- 0.7-0.89: High confidence, outcome is likely correct
- 0.5-0.69: Moderate confidence, some uncertainty
- Below 0.5: Low confidence, may need more information

Only suggest an outcome if you have reasonable confidence (>= 0.6) and can provide verifiable evidence.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI oracle that provides objective, evidence-based resolutions for prediction markets. Always base your decisions on verifiable facts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const resolution = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    const result = {
      marketId,
      ...resolution,
      timestamp: new Date().toISOString()
    };
    
    cache.set('suggestMarketResolution', result, marketId, question);
    return result;
  } catch (error) {
    console.error('Error suggesting market resolution:', error);
    throw error;
  }
}

module.exports = {
  suggestMarketResolution
};

