const openai = require('../lib/openai');
const coingecko = require('../lib/coingecko/prices');
const { ethers } = require('ethers');

// Get all stakes with caching (long-term solution for timeout issues)
const getStakeablePredictions = async (req, res) => {
  try {
    const blockchain = require('../lib/blockchain');
    
    // Allow bypassing cache with ?refresh=true query parameter
    const refresh = req.query.refresh === 'true' || req.query.nocache === 'true';
    const result = await blockchain.getAllStakes({ useCache: !refresh, activeOnly: false });
    
    if (result === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stakes from blockchain',
        predictions: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    const cacheInfo = blockchain.getStakesCacheInfo();
    
    res.json({
      success: true,
      predictions: result.stakes || [],
      count: result.stakes?.length || 0,
      totalStakes: result.totalStakes || '0',
      totalAmountStaked: result.totalAmountStaked || '0',
      cached: cacheInfo.cached && cacheInfo.age < cacheInfo.ttl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stakeable predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stakeable predictions',
      predictions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

// Generate AI prediction suggestion only (no blockchain interaction)
// Frontend should handle recording to blockchain
const createPredictionAndRegister = async (req, res) => {
  try {
    const { cryptoId, symbol } = req.body;
    
    if (!cryptoId || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId and symbol are required'
      });
    }

    const priceData = await coingecko.fetchCryptoPrices([cryptoId], 'usd', true);
    const crypto = priceData.find(c => c.id === cryptoId);
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: 'Crypto not found'
      });
    }

    const suggestion = await openai.generatePriceSuggestion(crypto, null, true);
    
    if (!suggestion.direction || !suggestion.percentChange) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate prediction'
      });
    }

    const currentPrice = crypto.price;
    let predictedPrice;
    
    if (suggestion.direction === 'up') {
      predictedPrice = currentPrice * (1 + suggestion.percentChange / 100);
    } else if (suggestion.direction === 'down') {
      predictedPrice = currentPrice * (1 - suggestion.percentChange / 100);
    } else {
      predictedPrice = currentPrice;
    }

    // Return suggestion data for frontend to record on-chain
    res.json({
      success: true,
      suggestion: {
        cryptoId,
        symbol,
        currentPrice,
        predictedPrice,
        direction: suggestion.direction,
        percentChange: Math.abs(suggestion.percentChange),
        reasoning: suggestion.reasoning,
        newsSources: suggestion.newsSources || []
      },
      message: 'Use this data to record prediction on-chain from frontend',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating prediction suggestion:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate prediction suggestion'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }
    
    const blockchain = require('../lib/blockchain');
    
    if (!process.env.BLOCKCHAIN_CONTRACT_ADDRESS && !process.env.MAIN_CONTRACT_ADDRESS && !process.env.PREDICTION_STAKING_ADDRESS && !process.env.CONTRACT_ADDRESS) {
      return res.status(500).json({
        success: false,
        error: 'Contract address not configured. Please set BLOCKCHAIN_CONTRACT_ADDRESS, MAIN_CONTRACT_ADDRESS, PREDICTION_STAKING_ADDRESS, or CONTRACT_ADDRESS in your .env file'
      });
    }
    
    // Calculate stats from user stakes using predictionCorrect for consistency with frontend
    const userStakes = await blockchain.getUserStakesWithDetails(address);
    
    if (!userStakes || userStakes.length === 0) {
      return res.json({
        success: true,
        stats: {
          wins: '0',
          losses: '0',
          totalStaked: '0',
          totalWon: '0',
          totalLost: '0',
          winRate: '0'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    let wins = 0;
    let losses = 0;
    let totalStaked = BigInt(0);
    let totalWon = BigInt(0);
    let totalLost = BigInt(0);
    
    for (const stake of userStakes) {
      const amountWei = BigInt(stake.amountWei || '0');
      totalStaked += amountWei;
      
      if (stake.isResolved && stake.predictionCorrect !== null && stake.predictionCorrect !== undefined) {
        if (stake.predictionCorrect) {
          wins++;
          // For winners, estimate total won (original stake + share of losers)
          // This is an approximation since we'd need full stake data for exact calculation
          totalWon += amountWei;
        } else {
          losses++;
          totalLost += amountWei;
        }
      }
    }
    
    // Calculate win rate (scaled by 10000 for 2 decimals: 6250 = 62.50%)
    let winRate = 0;
    if (wins + losses > 0) {
      winRate = Math.floor((wins * 10000) / (wins + losses));
    }
    
    res.json({
      success: true,
      stats: {
        wins: wins.toString(),
        losses: losses.toString(),
        totalStaked: totalStaked.toString(),
        totalWon: totalWon.toString(),
        totalLost: totalLost.toString(),
        winRate: winRate.toString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stats'
    });
  }
};

const getUserStakes = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'User address is required',
        stakes: []
      });
    }
      
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format',
        stakes: []
      });
    }
      
    const blockchain = require('../lib/blockchain');
    const stakes = await blockchain.getUserStakesWithDetails(address);
    
    if (stakes === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stakes from blockchain',
        stakes: []
      });
    }
    
    res.json({
      success: true,
      stakes: stakes,
      count: stakes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user stakes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stakes',
      stakes: []
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const blockchain = require('../lib/blockchain');
    const analytics = await blockchain.getAnalytics();
    
    if (analytics === null) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics from blockchain',
        analytics: null
      });
    }
    
    res.json({
      success: true,
      analytics: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analytics',
      analytics: null
    });
  }
};

// Deprecated: Blockchain interactions moved to frontend
const getClaimablePredictions = async (req, res) => {
  try {
    const { address } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    const claimable = [];
    
    res.json({
      success: true,
      predictions: claimable,
      count: claimable.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting claimable predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get claimable predictions',
      predictions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
};

const triggerAutoResolve = async (req, res) => {
  try {
    const autoResolve = require('../scripts/autoResolve');
    const result = await autoResolve.autoResolveExpiredStakes();
    
    const response = {
      success: true,
      summary: {
        resolved: result.resolved || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        message: result.message || (result.total === 0 ? 'No expired stakes to resolve' : `Resolved ${result.resolved} of ${result.total} expired stakes`)
      },
      results: result.results || [],
      timestamp: result.timestamp || new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error triggering auto-resolve:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger auto-resolve',
      summary: {
        resolved: 0,
        failed: 0,
        total: 0,
        message: 'Auto-resolve failed: ' + (error.message || 'Unknown error')
      },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getStakeablePredictions,
  getUserStats,
  getUserStakes,
  getClaimablePredictions,
  createPredictionAndRegister,
  getAnalytics,
  triggerAutoResolve
};
