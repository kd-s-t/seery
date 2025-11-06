#!/usr/bin/env node

const OpenAI = require('openai');
const prompts = require('./prompts');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

// Helper to fetch news
async function fetchNews(topic, count = 5) {
  try {
    console.log(`${colors.cyan}🔍 Fetching ${count} news articles about "${topic}"...${colors.reset}\n`);
    
    const prompt = prompts.getNewsFetchPrompt(topic, count);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: prompts.NEWS_AGGREGATOR_SYSTEM,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content.trim();
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    const news = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return news;
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    throw error;
  }
}

// Helper to analyze news
async function analyzeNews(title, newsText) {
  try {
    console.log(`${colors.cyan}🤖 Analyzing news article...${colors.reset}\n`);
    
    const prompt = prompts.getNewsAnalysisPrompt(title, newsText);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: prompts.NEWS_ANALYZER_SYSTEM,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    return analysis;
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    throw error;
  }
}

// Display news in terminal
function displayNews(news) {
  console.log(`${colors.bright}${colors.green}📰 News Articles:${colors.reset}\n`);
  
  news.forEach((article, index) => {
    const sentimentEmoji = article.sentiment === 'positive' ? '📈' : 
                          article.sentiment === 'negative' ? '📉' : '➡️';
    const sentimentColor = article.sentiment === 'positive' ? colors.green :
                          article.sentiment === 'negative' ? colors.red : colors.yellow;
    
    console.log(`${colors.bright}${colors.blue}${index + 1}. ${article.title}${colors.reset}`);
    console.log(`${colors.gray}   Source: ${article.source}${article.date ? ` | ${article.date}` : ''}${colors.reset}`);
    console.log(`${sentimentColor}   ${sentimentEmoji} ${article.sentiment.toUpperCase()}${colors.reset}`);
    if (article.relevanceScore) {
      console.log(`${colors.gray}   Relevance: ${article.relevanceScore}/100${colors.reset}`);
    }
    console.log(`${colors.cyan}   ${article.summary}${colors.reset}`);
    if (article.url) {
      console.log(`${colors.gray}   ${article.url}${colors.reset}`);
    }
    console.log('');
  });
}

// Display analysis in terminal
function displayAnalysis(analysis) {
  console.log(`${colors.bright}${colors.green}📊 Analysis Results:${colors.reset}\n`);
  
  const sentimentEmoji = analysis.sentiment === 'positive' ? '📈' : 
                        analysis.sentiment === 'negative' ? '📉' : '➡️';
  const sentimentColor = analysis.sentiment === 'positive' ? colors.green :
                        analysis.sentiment === 'negative' ? colors.red : colors.yellow;
  
  console.log(`${colors.bright}Sentiment:${colors.reset} ${sentimentColor}${sentimentEmoji} ${analysis.sentiment.toUpperCase()} (Score: ${analysis.sentimentScore}/100)${colors.reset}`);
  console.log(`${colors.bright}Impact:${colors.reset} ${colors.yellow}${analysis.impact.toUpperCase()}${colors.reset}`);
  if (analysis.priceImpact) {
    console.log(`${colors.bright}Price Impact:${colors.reset} ${colors.cyan}${analysis.priceImpact}${colors.reset}`);
  }
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`${colors.cyan}${analysis.summary}${colors.reset}\n`);
  
  if (analysis.keyPoints && analysis.keyPoints.length > 0) {
    console.log(`${colors.bright}Key Points:${colors.reset}`);
    analysis.keyPoints.forEach(point => {
      console.log(`${colors.green}  • ${point}${colors.reset}`);
    });
    console.log('');
  }
  
  if (analysis.keywords && analysis.keywords.length > 0) {
    console.log(`${colors.bright}Keywords:${colors.reset} ${analysis.keywords.join(', ')}\n`);
  }
  
  if (analysis.entities && analysis.entities.length > 0) {
    console.log(`${colors.bright}Entities:${colors.reset} ${analysis.entities.join(', ')}\n`);
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error(`${colors.red}❌ Error: OPENAI_API_KEY not found in environment variables${colors.reset}`);
    console.log(`${colors.yellow}💡 Create a .env file with: OPENAI_API_KEY=sk-your-key-here${colors.reset}`);
    process.exit(1);
  }
  
  if (args.length === 0) {
    console.log(`${colors.bright}${colors.blue}📰 News Checker CLI${colors.reset}\n`);
    console.log(`${colors.bright}Usage:${colors.reset}`);
    console.log(`  node cli.js news <topic> [count]    - Fetch news articles`);
    console.log(`  node cli.js bitcoin [count]         - Fetch Bitcoin news`);
    console.log(`  node cli.js analyze <text>          - Analyze news text`);
    console.log(`\n${colors.bright}Examples:${colors.reset}`);
    console.log(`  node cli.js news bitcoin 5`);
    console.log(`  node cli.js bitcoin 10`);
    console.log(`  node cli.js news "ethereum price" 3`);
    console.log(`  node cli.js analyze "Bitcoin dropped 10% today..."`);
    process.exit(0);
  }
  
  const command = args[0];
  
  try {
    if (command === 'news') {
      const topic = args[1] || 'bitcoin';
      const count = parseInt(args[2]) || 5;
      const news = await fetchNews(topic, count);
      displayNews(news);
      
    } else if (command === 'bitcoin') {
      const count = parseInt(args[1]) || 10;
      const prompt = prompts.getBitcoinNewsPrompt(count);
      
      console.log(`${colors.cyan}🔍 Fetching ${count} Bitcoin news articles...${colors.reset}\n`);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompts.NEWS_AGGREGATOR_SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const content = completion.choices[0].message.content.trim();
      let jsonMatch = content.match(/\[[\s\S]*\]/);
      const news = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      
      displayNews(news);
      
    } else if (command === 'analyze') {
      const text = args.slice(1).join(' ');
      if (!text) {
        console.error(`${colors.red}❌ Error: Please provide text to analyze${colors.reset}`);
        process.exit(1);
      }
      const analysis = await analyzeNews('', text);
      displayAnalysis(analysis);
      
    } else {
      console.error(`${colors.red}❌ Unknown command: ${command}${colors.reset}`);
      console.log(`Use: node cli.js news <topic> [count]`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run CLI
main();

