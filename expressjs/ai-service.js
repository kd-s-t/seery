const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate prediction markets from news articles
 */
async function generateMarketsFromNews(topic = 'cryptocurrency', count = 3) {
  try {
    const prompt = `Based on recent news about ${topic}, generate ${count} prediction market questions that would be interesting and tradable.

For each market, provide:
1. A clear, specific question
2. 2-4 possible outcomes
3. A suggested duration (in hours, typically 24-168 hours)
4. Why this market would be valuable

Return a JSON array with this structure:
[
  {
    "question": "Will Bitcoin reach $X by [date]?",
    "outcomes": ["Yes", "No"],
    "durationHours": 72,
    "reasoning": "Recent news suggests..."
  }
]

Focus on:
- Events that can be objectively verified
- Time-bound predictions
- Outcomes that are clear and unambiguous
- Markets that would attract traders`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating prediction markets. Generate clear, tradeable markets based on current events and news.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const markets = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return markets;
  } catch (error) {
    console.error('Error generating markets from news:', error);
    throw error;
  }
}

/**
 * Use AI to suggest resolution for a market
 * This provides faster resolution than traditional oracles
 */
async function suggestMarketResolution(marketId, question, outcomes, context = '') {
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
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const resolution = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return {
      marketId,
      ...resolution,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error suggesting market resolution:', error);
    throw error;
  }
}

/**
 * Analyze news to create market suggestions
 */
async function analyzeNewsForMarkets(topic = 'bitcoin', articleCount = 5) {
  try {
    // First, get news articles (using existing news fetching logic)
    const newsPrompt = `Find the latest ${articleCount} news articles about ${topic}. 
    Provide a JSON array with:
    [
      {
        "title": "Article title",
        "summary": "Brief summary",
        "date": "Date",
        "source": "Source"
      }
    ]`;

    const newsCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a news aggregator. Provide factual news summaries.'
        },
        {
          role: 'user',
          content: newsPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const newsContent = newsCompletion.choices[0].message.content.trim();
    const newsJsonMatch = newsContent.match(/\[[\s\S]*\]/);
    const news = newsJsonMatch ? JSON.parse(newsJsonMatch[0]) : JSON.parse(newsContent);

    // Then generate markets from the news
    const marketsPrompt = `Based on these news articles, generate 3-5 prediction market questions:

${JSON.stringify(news, null, 2)}

For each market, provide:
- A clear, specific question
- 2-4 possible outcomes
- Suggested duration (24-168 hours)
- Why this market is valuable

Return JSON array:
[
  {
    "question": "Question",
    "outcomes": ["Outcome1", "Outcome2"],
    "durationHours": 72,
    "reasoning": "Why this market matters",
    "relatedNews": ["Article title 1", "Article title 2"]
  }
]`;

    const marketsCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating prediction markets from news events.'
        },
        {
          role: 'user',
          content: marketsPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const marketsContent = marketsCompletion.choices[0].message.content.trim();
    const marketsJsonMatch = marketsContent.match(/\[[\s\S]*\]/);
    const markets = marketsJsonMatch ? JSON.parse(marketsJsonMatch[0]) : JSON.parse(marketsContent);

    return {
      news,
      markets
    };
  } catch (error) {
    console.error('Error analyzing news for markets:', error);
    throw error;
  }
}

module.exports = {
  generateMarketsFromNews,
  suggestMarketResolution,
  analyzeNewsForMarkets
};

