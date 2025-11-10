const express = require('express');
const cors = require('cors');
require('dotenv').config();

const blockchain = require('./blockchain');
const openai = require('./lib/openai');
const coingecko = require('./lib/coingecko/prices');

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3015',
  credentials: true
}));
app.use(express.json());
// Frontend is now in separate React app (seer folder)

// Initialize blockchain connection
blockchain.initBlockchain(process.env.NETWORK || 'testnet');

// ==================== PREDICTION MARKET ROUTES ====================

/**
 * GET /api/markets
 * Get all markets from blockchain
 */
app.get('/api/markets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Set a timeout for the request (30 seconds max)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - blockchain calls taking too long')), 30000);
    });
    
    const marketsPromise = blockchain.getAllMarketsFromChain(limit, offset);
    
    const markets = await Promise.race([marketsPromise, timeoutPromise]);
    
    res.json({
      success: true,
      markets,
      count: markets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    
    // If timeout, return empty array instead of error (better UX)
    if (error.message.includes('timeout')) {
      return res.json({
        success: true,
        markets: [],
        count: 0,
        timestamp: new Date().toISOString(),
        warning: 'Markets are loading slowly. Please try again in a moment.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch markets'
    });
  }
});

/**
 * GET /api/markets/:id
 * Get a specific market from blockchain
 */
app.get('/api/markets/:id', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    
    // Get market data from chain
    const marketData = await blockchain.getMarketFromChain(marketId);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    // Get outcomes
    const outcomes = await blockchain.getMarketOutcomesFromChain(marketId);
    if (!outcomes) {
      return res.status(404).json({
        success: false,
        error: 'Market outcomes not found'
      });
    }
    
    // Get outcome pools
    const outcomePools = {};
    for (let i = 0; i < outcomes.length; i++) {
      const pool = await blockchain.getOutcomePoolFromChain(marketId, i);
      outcomePools[i] = {
        total: parseFloat(pool),
        chain: pool
      };
    }
    
    res.json({
      success: true,
      market: {
        market_id: marketId,
        question: marketData.question,
        outcomes,
        creator: marketData.creator,
        endTime: parseInt(marketData.endTime),
        resolved: marketData.resolved,
        winningOutcome: marketData.resolved ? parseInt(marketData.winningOutcome) : null,
        totalPool: marketData.totalPool,
        outcomePools
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market'
    });
  }
});

/**
 * POST /api/markets
 * Create a new prediction market (on-chain only)
 * Note: This is just a helper endpoint. Frontend should call contract directly.
 */
app.post('/api/markets', async (req, res) => {
  try {
    const { question, outcomes, durationHours, creatorAddress } = req.body;
    
    if (!question || !outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Question and at least 2 outcomes are required'
      });
    }
    
    // Note: Market creation should be done directly from frontend via MetaMask
    // This endpoint just returns the parameters needed
    res.json({
      success: true,
      message: 'Market should be created on-chain via MetaMask',
      requiredParams: {
        question,
        outcomes,
        durationHours: durationHours || 72
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create market'
    });
  }
});

/**
 * POST /api/markets/:id/bet
 * Place a bet (on-chain only)
 * Note: This is just for tracking. Frontend should call contract directly.
 */
app.post('/api/markets/:id/bet', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const { userAddress, outcome, amount, txHash } = req.body;
    
    if (!userAddress || outcome === undefined || !amount) {
      return res.status(400).json({
        success: false,
        error: 'userAddress, outcome, and amount are required'
      });
    }
    
    // Verify bet exists on-chain
    const contract = blockchain.getContract();
    if (contract && userAddress) {
      try {
        const userBet = await contract.getUserBet(marketId, userAddress, outcome);
        const betAmount = parseFloat(blockchain.formatBNB(userBet));
        
        res.json({
          success: true,
          message: 'Bet verified on-chain',
          bet: {
            marketId,
            userAddress,
            outcome,
            amount: betAmount,
            txHash: txHash || 'pending'
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.json({
          success: true,
          message: 'Bet recorded (verification pending)',
          bet: {
            marketId,
            userAddress,
            outcome,
            amount,
            txHash: txHash || 'pending'
          },
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.json({
        success: true,
        message: 'Bet recorded (no contract verification)',
        bet: {
          marketId,
          userAddress,
          outcome,
          amount
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error processing bet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process bet'
    });
  }
});

/**
 * POST /api/markets/:id/resolve
 * Resolve a market (with AI assistance)
 */
app.post('/api/markets/:id/resolve', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const { winningOutcome, useAI } = req.body;
    
    const marketData = await blockchain.getMarketFromChain(marketId);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    if (marketData.resolved) {
      return res.status(400).json({
        success: false,
        error: 'Market is already resolved'
      });
    }
    
    let finalOutcome = winningOutcome;
    let aiResolution = null;
    
    // Use AI to suggest resolution if requested
    if (useAI) {
      try {
        const outcomes = await blockchain.getMarketOutcomesFromChain(marketId);
        aiResolution = await openai.suggestMarketResolution(
          marketId,
          marketData.question,
          outcomes || []
        );
        
        // Use AI suggestion if no manual outcome provided
        if (winningOutcome === undefined) {
          finalOutcome = aiResolution.suggestedOutcome;
        }
      } catch (error) {
        console.error('Error getting AI resolution:', error);
        // Continue with manual resolution if AI fails
      }
    }
    
    if (finalOutcome === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Valid winning outcome is required'
      });
    }
    
    // Note: Resolution should be done on-chain via MetaMask
    // This endpoint just returns the suggested outcome
    res.json({
      success: true,
      message: 'Market should be resolved on-chain via MetaMask',
      resolution: {
        marketId,
        suggestedOutcome: finalOutcome,
        aiResolution
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving market:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve market'
    });
  }
});

/**
 * GET /api/markets/:id/bets
 * Get all bets for a market (from blockchain)
 */
app.get('/api/markets/:id/bets', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const contract = blockchain.getContract();
    
    if (!contract) {
      return res.json({
        success: true,
        bets: [],
        message: 'Contract not available',
        count: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Note: Getting all bets requires iterating through all addresses
    // This is expensive. For now, return a message that bets are on-chain.
    res.json({
      success: true,
      message: 'Bets are stored on-chain. Query contract events for full bet history.',
      bets: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bets'
    });
  }
});

/**
 * GET /api/users/:address/bets
 * Get all bets by a user (from blockchain)
 */
app.get('/api/users/:address/bets', async (req, res) => {
  try {
    const userAddress = req.params.address;
    const contract = blockchain.getContract();
    
    if (!contract) {
      return res.json({
        success: true,
        bets: [],
        message: 'Contract not available',
        count: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get market count
    const marketCount = await blockchain.getMarketCountFromChain();
    const bets = [];
    
    // Check each market for user's bets
    for (let i = 1; i <= marketCount; i++) {
      try {
        const marketData = await blockchain.getMarketFromChain(i);
        if (!marketData) continue;
        
        const outcomes = await blockchain.getMarketOutcomesFromChain(i);
        if (!outcomes) continue;
        
        for (let j = 0; j < outcomes.length; j++) {
          const betAmount = await contract.getUserBet(i, userAddress, j);
          if (betAmount > 0) {
            bets.push({
              marketId: i,
              question: marketData.question,
              outcome: j,
              outcomeLabel: outcomes[j],
              amount: blockchain.formatBNB(betAmount)
            });
          }
        }
      } catch (error) {
        // Market might not exist, skip
      }
    }
    
    res.json({
      success: true,
      bets,
      count: bets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user bets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user bets'
    });
  }
});

// ==================== AI-POWERED MARKET GENERATION ====================

/**
 * POST /api/ai/generate-markets
 * Generate prediction markets from news
 */
app.post('/api/ai/generate-markets', async (req, res) => {
  try {
    const { topic, count } = req.body;
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'AI features are disabled. OPENAI_API_KEY not configured.',
        errorCode: 'AI_DISABLED',
        helpUrl: 'https://platform.openai.com/api-keys',
        message: 'To enable AI features, add OPENAI_API_KEY to your .env file. The app works without AI - you can create markets manually.'
      });
    }
    
    const markets = await openai.generateMarketsFromNews(
      topic || 'cryptocurrency',
      count || 3
    );
    
    res.json({
      success: true,
      markets,
      count: markets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating markets:', error);
    
    // Handle OpenAI quota/rate limit errors
    const errorMessage = error.message || '';
    const statusCode = error.status || error.response?.status || 500;
    
    let userMessage = 'Failed to generate markets';
    if (errorMessage.includes('not configured') || errorMessage.includes('disabled')) {
      return res.status(503).json({
        success: false,
        error: 'AI features are disabled. OPENAI_API_KEY not configured.',
        errorCode: 'AI_DISABLED',
        helpUrl: 'https://platform.openai.com/api-keys'
      });
    }
    
    if (statusCode === 429 || errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded your current quota')) {
      userMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      res.status(429).json({
        success: false,
        error: userMessage,
        errorCode: 'QUOTA_EXCEEDED',
        helpUrl: 'https://platform.openai.com/account/billing',
        details: 'This usually means: 1) No payment method added, 2) Spending limit reached, or 3) Rate limit exceeded. Check your billing at https://platform.openai.com/account/billing',
        solutions: [
          'Add a payment method at https://platform.openai.com/account/billing',
          'Increase your spending limit at https://platform.openai.com/account/billing/limits',
          'Wait a few minutes and try again (if rate limited)',
          'Check your usage at https://platform.openai.com/usage'
        ]
      });
    } else if (errorMessage.includes('rate limit')) {
      userMessage = 'OpenAI API rate limit exceeded. Please try again in a moment.';
      res.status(429).json({
        success: false,
        error: userMessage,
        errorCode: 'RATE_LIMIT'
      });
    } else {
      res.status(statusCode).json({
        success: false,
        error: userMessage
      });
    }
  }
});

/**
 * POST /api/ai/analyze-news
 * Analyze news and suggest markets
 */
app.post('/api/ai/analyze-news', async (req, res) => {
  try {
    const { topic, articleCount } = req.body;
    
    const result = await openai.analyzeNewsForMarkets(
      topic || 'bitcoin',
      articleCount || 5
    );
    
    res.json({
      success: true,
      news: result.news,
      suggestedMarkets: result.markets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing news:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze news'
    });
  }
});

/**
 * GET /api/markets/:id/ai-resolution
 * Get AI resolution suggestion for a market
 */
app.get('/api/markets/:id/ai-resolution', async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const marketData = await blockchain.getMarketFromChain(marketId);
    
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }
    
    const outcomes = await blockchain.getMarketOutcomesFromChain(marketId);
    
    // Generate new AI resolution
    const aiResolution = await openai.suggestMarketResolution(
      marketId,
      marketData.question,
      outcomes || []
    );
    
    res.json({
      success: true,
      resolution: aiResolution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI resolution:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI resolution'
    });
  }
});

// ==================== CRYPTO PRICES & AI SUGGESTIONS ====================

/**
 * GET /api/crypto/prices
 * Get current crypto prices with AI suggestions
 */
app.get('/api/crypto/prices', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'polkadot', 'chainlink', 'avalanche-2', 'polygon', 'litecoin'];
    
    const priceData = await coingecko.fetchCryptoPrices(symbols);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        cryptos: priceData.map(crypto => ({
          ...crypto,
          suggestion: null,
          suggestionPercent: null,
          reasoning: 'AI features disabled. OPENAI_API_KEY not configured.'
        })),
        timestamp: new Date().toISOString()
      });
    }
    
    const cryptosWithSuggestions = await Promise.all(
      priceData.map(async (crypto) => {
        try {
          const suggestion = await openai.generatePriceSuggestion(crypto);
          return {
            ...crypto,
            suggestion: suggestion.direction,
            suggestionPercent: suggestion.percentChange,
            reasoning: suggestion.reasoning
          };
        } catch (error) {
          console.error(`Error generating suggestion for ${crypto.symbol}:`, error);
          return {
            ...crypto,
            suggestion: null,
            suggestionPercent: null,
            reasoning: 'Failed to generate suggestion'
          };
        }
      })
    );
    
    res.json({
      success: true,
      cryptos: cryptosWithSuggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch crypto prices'
    });
  }
});

// ==================== CONFIG ====================

/**
 * GET /api/config
 * Get frontend configuration (contract address, etc.)
 */
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    network: process.env.NETWORK || 'testnet',
    timestamp: new Date().toISOString()
  });
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Prediction Market API is running (Blockchain-only mode)',
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Prediction Market API running on http://localhost:${PORT}`);
  console.log(`⛓️  Blockchain: ${process.env.CONTRACT_ADDRESS ? 'Connected' : 'No contract address set'}`);
  console.log(`🤖 AI: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`📊 Mode: Blockchain-only (no database)`);
});
