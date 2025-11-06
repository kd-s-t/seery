/**
 * Prompt templates for OpenAI news operations
 * You can customize these prompts to change the behavior of the API
 */

// System prompt for news aggregation
const NEWS_AGGREGATOR_SYSTEM = `You are a helpful news aggregator. Your job is to find, summarize, and structure news articles. 
Always respond with valid JSON only, no additional text or explanations outside the JSON structure.`;

// System prompt for news analysis
const NEWS_ANALYZER_SYSTEM = `You are a financial news analyst with expertise in cryptocurrency, technology, and market trends. 
Your analysis should be accurate, objective, and insightful. Always respond with valid JSON only.`;

/**
 * Generate prompt for fetching news articles
 * @param {string} topic - The topic to search for
 * @param {number} count - Number of articles to fetch
 * @returns {string} The prompt
 */
function getNewsFetchPrompt(topic, count = 5) {
  return `Find and summarize the latest ${count} news articles about "${topic}". 
Provide a JSON array with this exact structure:
[
  {
    "title": "Article title",
    "summary": "Brief 2-3 sentence summary of the article",
    "source": "Source name (e.g., CoinDesk, Reuters, etc.)",
    "url": "URL if available, otherwise null",
    "date": "Publication date if available, otherwise approximate date",
    "sentiment": "positive/negative/neutral",
    "relevanceScore": 0-100
  }
]

Requirements:
- Focus on recent news from the last 2 weeks
- Include actual events, price movements, and significant developments
- If you cannot access live URLs, provide summaries based on your knowledge and training data
- Ensure all summaries are factual and informative
- Sort articles by relevance and recency
- Return exactly ${count} articles`;

  // Alternative version if you want more detail:
  // return `Research and compile ${count} recent news articles about ${topic}. 
  // For each article, provide:
  // - A clear, descriptive title
  // - A comprehensive summary (3-4 sentences) covering key facts
  // - The source publication name
  // - URL if available
  // - Publication or relevant date
  // - Sentiment analysis (positive/negative/neutral)
  // - Relevance score (0-100) based on how relevant it is to "${topic}"
  // 
  // Prioritize:
  // 1. News from the last 14 days
  // 2. Articles with significant impact or importance
  // 3. Information from reputable sources
  // 
  // Return as JSON array with the structure specified above.`;
}

/**
 * Generate prompt for analyzing news sentiment and content
 * @param {string} title - Article title
 * @param {string} newsText - Article content
 * @returns {string} The prompt
 */
function getNewsAnalysisPrompt(title, newsText) {
  return `Analyze this news article and provide a comprehensive JSON response:

Title: ${title || 'N/A'}
Content: ${newsText}

Provide JSON with this exact structure:
{
  "sentiment": "positive/negative/neutral",
  "sentimentScore": 0-100,
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "summary": "2-3 sentence summary of the article",
  "impact": "high/medium/low",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "entities": ["Person/Company names mentioned"],
  "priceImpact": "likely increase/likely decrease/neutral/uncertain"
}

Guidelines:
- Sentiment score: 0-40 = negative, 41-60 = neutral, 61-100 = positive
- Impact should reflect the potential market or industry significance
- Extract the most important entities (people, companies, organizations)
- For cryptocurrency-related news, assess potential price impact
- Be objective and data-driven in your analysis`;
}

/**
 * Generate prompt for Bitcoin-specific news
 * @param {number} count - Number of articles
 * @returns {string} The prompt
 */
function getBitcoinNewsPrompt(count = 10) {
  return `Find the latest ${count} news articles specifically about Bitcoin (BTC), cryptocurrency markets, blockchain technology, and related developments.

Focus on:
- Bitcoin price movements and market analysis
- Adoption news and institutional interest
- Regulatory developments
- Technical updates and network developments
- Major market events and liquidations
- Mining and network statistics

Provide a JSON array with this structure:
[
  {
    "title": "Article title",
    "summary": "Detailed summary including key numbers, dates, and facts",
    "source": "Source name",
    "url": "URL if available",
    "date": "Date",
    "sentiment": "positive/negative/neutral",
    "relevanceScore": 0-100,
    "category": "price/regulation/adoption/technology/market event"
  }
]

Prioritize the most recent and significant Bitcoin-related news from the last 2 weeks.`;
}

/**
 * Generate prompt for custom news search
 * @param {string} query - Search query
 * @param {number} count - Number of results
 * @returns {string} The prompt
 */
function getNewsSearchPrompt(query, count = 5) {
  return `Search for and summarize ${count} news articles related to: "${query}"

Provide a JSON array with this structure:
[
  {
    "title": "Article title",
    "summary": "Comprehensive summary",
    "source": "Source name",
    "url": "URL if available",
    "date": "Date",
    "sentiment": "positive/negative/neutral",
    "relevanceScore": 0-100
  }
]

Focus on:
- Recent news (last 2 weeks preferred)
- Most relevant articles matching the search query
- Articles from reputable sources
- Factual and informative content

Return exactly ${count} articles sorted by relevance.`;
}

module.exports = {
  NEWS_AGGREGATOR_SYSTEM,
  NEWS_ANALYZER_SYSTEM,
  getNewsFetchPrompt,
  getNewsAnalysisPrompt,
  getBitcoinNewsPrompt,
  getNewsSearchPrompt,
};

