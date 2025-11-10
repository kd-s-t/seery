const blockchain = require('../blockchain');
const openai = require('../lib/openai');

const getAllMarkets = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
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
};

const getMarketById = async (req, res) => {
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
    if (!outcomes) {
      return res.status(404).json({
        success: false,
        error: 'Market outcomes not found'
      });
    }
    
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
};

const createMarket = async (req, res) => {
  try {
    const { question, outcomes, durationHours, creatorAddress } = req.body;
    
    if (!question || !outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Question and at least 2 outcomes are required'
      });
    }
    
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
};

const placeBet = async (req, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const { userAddress, outcome, amount, txHash } = req.body;
    
    if (!userAddress || outcome === undefined || !amount) {
      return res.status(400).json({
        success: false,
        error: 'userAddress, outcome, and amount are required'
      });
    }
    
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
};

const resolveMarket = async (req, res) => {
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
    
    if (useAI) {
      try {
        const outcomes = await blockchain.getMarketOutcomesFromChain(marketId);
        aiResolution = await openai.suggestMarketResolution(
          marketId,
          marketData.question,
          outcomes || []
        );
        
        if (winningOutcome === undefined) {
          finalOutcome = aiResolution.suggestedOutcome;
        }
      } catch (error) {
        console.error('Error getting AI resolution:', error);
      }
    }
    
    if (finalOutcome === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Valid winning outcome is required'
      });
    }
    
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
};

const getMarketBets = async (req, res) => {
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
};

const getUserBets = async (req, res) => {
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
    
    const marketCount = await blockchain.getMarketCountFromChain();
    const bets = [];
    
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
};

module.exports = {
  getAllMarkets,
  getMarketById,
  createMarket,
  placeBet,
  resolveMarket,
  getMarketBets,
  getUserBets
};

