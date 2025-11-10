const { getOpenAIClient } = require('./client');
const cache = require('./cache');

async function generateMarketsFromNews(topic = 'cryptocurrency', count = 3) {
  const cached = cache.get('generateMarketsFromNews', topic, count);
  if (cached) {
    return cached;
  }
  
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured. AI features are disabled.');
  }
  
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
    
    cache.set('generateMarketsFromNews', markets, topic, count);
    return markets;
  } catch (error) {
    console.error('Error generating markets from news:', error);
    throw error;
  }
}

async function analyzeNewsForMarkets(topic = 'bitcoin', articleCount = 5) {
  const cached = cache.get('analyzeNewsForMarkets', topic, articleCount);
  if (cached) {
    return cached;
  }
  
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured. AI features are disabled.');
  }
  
  try {
    const newsPrompt = `Find the latest ${articleCount} news articles about ${topic}. 
    Provide a JSON array with:
    [
      {
        "title": "Article title",
        "summary": "Brief 2-3 sentence summary of the article",
        "source": "Source name (e.g., CoinDesk, Reuters, etc.)",
        "url": "URL if available, otherwise null",
        "date": "Publication date if available, otherwise approximate date",
        "sentiment": "positive/negative/neutral"
      }
    ]
    
    Requirements:
    - Focus on recent news from the last 2 weeks
    - Include actual events, price movements, and significant developments
    - Provide real URLs when possible
    - Ensure all summaries are factual and informative
    - Sort articles by relevance and recency`;

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

    const result = {
      news,
      markets
    };
    
    cache.set('analyzeNewsForMarkets', result, topic, articleCount);
    return result;
  } catch (error) {
    console.error('Error analyzing news for markets:', error);
    throw error;
  }
}

module.exports = {
  generateMarketsFromNews,
  analyzeNewsForMarkets
};

