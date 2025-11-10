const { ethers } = require('ethers');
require('dotenv').config();

// BNB Chain configuration
const BNB_TESTNET_RPC = process.env.BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const BNB_MAINNET_RPC = process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.binance.org/';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ABI for PredictionMarket contract
const CONTRACT_ABI = [
  "function marketCount() view returns (uint256)",
  "function createMarket(string question, string[] outcomes, uint256 durationHours) returns (uint256)",
  "function placeBet(uint256 marketId, uint256 outcome) payable",
  "function resolveMarket(uint256 marketId, uint256 winningOutcome)",
  "function claimWinnings(uint256 marketId)",
  "function withdraw()",
  "function getMarket(uint256 marketId) view returns (address creator, string question, uint256 endTime, bool resolved, uint256 winningOutcome, uint256 totalPool)",
  "function getOutcomePool(uint256 marketId, uint256 outcome) view returns (uint256)",
  "function getUserBet(uint256 marketId, address user, uint256 outcome) view returns (uint256)",
  "function getMarketOutcomes(uint256 marketId) view returns (string[])",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question)",
  "event BetPlaced(uint256 indexed marketId, address indexed better, uint256 outcome, uint256 amount)",
  "event MarketResolved(uint256 indexed marketId, uint256 winningOutcome)"
];

let provider;
let contract;
let wallet;

/**
 * Initialize blockchain connection
 */
function initBlockchain(network = 'testnet') {
  try {
    const rpcUrl = network === 'mainnet' ? BNB_MAINNET_RPC : BNB_TESTNET_RPC;
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (CONTRACT_ADDRESS) {
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    
    if (PRIVATE_KEY) {
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      if (CONTRACT_ADDRESS) {
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
      }
    }
    
    return { provider, contract, wallet };
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    throw error;
  }
}

/**
 * Get provider (read-only)
 */
function getProvider() {
  if (!provider) {
    initBlockchain();
  }
  return provider;
}

/**
 * Get contract instance
 */
function getContract() {
  if (!contract) {
    initBlockchain();
  }
  return contract;
}

/**
 * Create a new market on-chain
 */
async function createMarketOnChain(question, outcomes, durationHours) {
  try {
    if (!wallet || !contract) {
      throw new Error('Wallet or contract not initialized. Set PRIVATE_KEY and CONTRACT_ADDRESS in .env');
    }
    
    const tx = await contract.createMarket(question, outcomes, durationHours);
    const receipt = await tx.wait();
    
    // Extract market ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'MarketCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      return parsed.args.marketId.toString();
    }
    
    // Fallback: get market count
    const marketCount = await contract.marketCount();
    return marketCount.toString();
  } catch (error) {
    console.error('Error creating market on-chain:', error);
    throw error;
  }
}

/**
 * Place a bet on-chain
 */
async function placeBetOnChain(marketId, outcome, amountInBNB) {
  try {
    if (!wallet || !contract) {
      throw new Error('Wallet or contract not initialized');
    }
    
    const amount = ethers.parseEther(amountInBNB.toString());
    const tx = await contract.placeBet(marketId, outcome, { value: amount });
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error placing bet on-chain:', error);
    throw error;
  }
}

/**
 * Resolve a market on-chain
 */
async function resolveMarketOnChain(marketId, winningOutcome) {
  try {
    if (!wallet || !contract) {
      throw new Error('Wallet or contract not initialized');
    }
    
    const tx = await contract.resolveMarket(marketId, winningOutcome);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error resolving market on-chain:', error);
    throw error;
  }
}

/**
 * Get market data from chain
 */
async function getMarketFromChain(marketId) {
  try {
    const contract = getContract();
    if (!contract) {
      return null;
    }
    
    const market = await contract.getMarket(marketId);
    return {
      creator: market.creator,
      question: market.question,
      endTime: market.endTime.toString(),
      resolved: market.resolved,
      winningOutcome: market.winningOutcome.toString(),
      totalPool: ethers.formatEther(market.totalPool)
    };
  } catch (error) {
    console.error('Error getting market from chain:', error);
    return null;
  }
}

/**
 * Get outcome pool from chain
 */
async function getOutcomePoolFromChain(marketId, outcome) {
  try {
    const contract = getContract();
    if (!contract) {
      return '0';
    }
    
    const pool = await contract.getOutcomePool(marketId, outcome);
    return ethers.formatEther(pool);
  } catch (error) {
    console.error('Error getting outcome pool:', error);
    return '0';
  }
}

/**
 * Get market outcomes from chain
 */
async function getMarketOutcomesFromChain(marketId) {
  try {
    const contract = getContract();
    if (!contract) {
      return null;
    }
    
    const outcomes = await contract.getMarketOutcomes(marketId);
    return outcomes;
  } catch (error) {
    console.error('Error getting market outcomes:', error);
    return null;
  }
}

/**
 * Get market count from chain
 */
async function getMarketCountFromChain() {
  try {
    const contract = getContract();
    if (!contract) {
      return 0;
    }
    
    const count = await contract.marketCount();
    return parseInt(count.toString());
  } catch (error) {
    console.error('Error getting market count:', error);
    return 0;
  }
}

/**
 * Get all markets from chain (by iterating through market IDs)
 */
async function getAllMarketsFromChain(limit = 50, offset = 0) {
  try {
    const contract = getContract();
    if (!contract) {
      return [];
    }
    
    const count = await getMarketCountFromChain();
    if (count === 0) {
      return [];
    }
    
    const startId = Math.max(1, offset + 1);
    const endId = Math.min(count, startId + limit);
    
    // Fetch all markets in parallel for better performance
    const marketPromises = [];
    for (let i = startId; i <= endId; i++) {
      marketPromises.push(
        (async () => {
          try {
            const marketData = await getMarketFromChain(i);
            if (!marketData) return null;
            
            const outcomes = await getMarketOutcomesFromChain(i);
            const outcomePools = {};
            
            // Fetch all outcome pools in parallel
            if (outcomes && outcomes.length > 0) {
              const poolPromises = outcomes.map((_, j) =>
                getOutcomePoolFromChain(i, j).then(pool => ({
                  index: j,
                  pool: parseFloat(pool),
                  chain: pool
                })).catch(() => ({ index: j, pool: 0, chain: '0' }))
              );
              
              const pools = await Promise.all(poolPromises);
              pools.forEach(({ index, pool, chain }) => {
                outcomePools[index] = { total: pool, chain };
              });
            }
            
            return {
              market_id: i,
              question: marketData.question,
              outcomes: outcomes || [],
              creator: marketData.creator,
              endTime: parseInt(marketData.endTime),
              resolved: marketData.resolved,
              winningOutcome: marketData.resolved ? parseInt(marketData.winningOutcome) : null,
              totalPool: marketData.totalPool,
              outcomePools
            };
          } catch (error) {
            // Market might not exist, skip it
            console.log(`Market ${i} not found, skipping`);
            return null;
          }
        })()
      );
    }
    
    // Wait for all markets to load in parallel
    const results = await Promise.all(marketPromises);
    
    // Filter out null results (markets that don't exist)
    return results.filter(market => market !== null);
  } catch (error) {
    console.error('Error getting all markets:', error);
    return [];
  }
}

/**
 * Format BNB amount
 */
function formatBNB(amount) {
  return ethers.formatEther(amount);
}

/**
 * Parse BNB amount
 */
function parseBNB(amount) {
  return ethers.parseEther(amount.toString());
}

module.exports = {
  initBlockchain,
  getProvider,
  getContract,
  createMarketOnChain,
  placeBetOnChain,
  resolveMarketOnChain,
  getMarketFromChain,
  getOutcomePoolFromChain,
  getMarketOutcomesFromChain,
  getMarketCountFromChain,
  getAllMarketsFromChain,
  formatBNB,
  parseBNB
};

