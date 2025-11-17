const { ethers } = require('ethers');

// Chainlink Price Feed ABI (AggregatorV3Interface)
const AGGREGATOR_V3_INTERFACE_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
    name: 'getRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Chainlink Price Feed addresses on BNB Chain
// Testnet addresses
const TESTNET_PRICE_FEEDS = {
  'bitcoin': '0x264990fbd0A4796A3E3d8E37C4d5F87a3ECA5EBE',      // BTC/USD
  'ethereum': '0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7',    // ETH/USD
  'binancecoin': '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526', // BNB/USD
  'chainlink': '0x81faeDDfeBc2F8Ac7493270E8510E3f3c85b2B40',   // LINK/USD
};

// Mainnet addresses
const MAINNET_PRICE_FEEDS = {
  'bitcoin': '0x264990fbd0A4796A3E3d8E37C4d5F87a3ECA5EBE',      // BTC/USD
  'ethereum': '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',    // ETH/USD
  'binancecoin': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE', // BNB/USD
  'chainlink': '0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8',  // LINK/USD
};

/**
 * Get Chainlink price feed address for a crypto
 * @param {string} cryptoId - CoinGecko crypto ID (e.g., 'bitcoin', 'ethereum')
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {string|null} Price feed address or null if not available
 */
function getPriceFeedAddress(cryptoId, network = 'testnet') {
  const feeds = network === 'mainnet' ? MAINNET_PRICE_FEEDS : TESTNET_PRICE_FEEDS;
  return feeds[cryptoId] || null;
}

/**
 * Check if a crypto has a Chainlink price feed
 * @param {string} cryptoId - CoinGecko crypto ID
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {boolean}
 */
function hasChainlinkFeed(cryptoId, network = 'testnet') {
  return getPriceFeedAddress(cryptoId, network) !== null;
}

/**
 * Get latest price from Chainlink oracle
 * @param {string} cryptoId - CoinGecko crypto ID
 * @param {Object} provider - Ethers provider
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {Promise<number|null>} Price in USD or null if not available
 */
async function getPriceFromChainlink(cryptoId, provider, network = 'testnet') {
  try {
    const feedAddress = getPriceFeedAddress(cryptoId, network);
    if (!feedAddress) {
      return null;
    }

    const priceFeed = new ethers.Contract(
      feedAddress,
      AGGREGATOR_V3_INTERFACE_ABI,
      provider
    );

    const roundData = await priceFeed.latestRoundData();
    const price = Number(roundData.answer);
    const decimals = await priceFeed.decimals();
    
    // Chainlink prices are typically in 8 decimals, convert to 18 for consistency
    const priceInUSD = price / Math.pow(10, decimals);
    
    return priceInUSD;
  } catch (error) {
    console.error(`Error fetching Chainlink price for ${cryptoId}:`, error.message);
    return null;
  }
}

/**
 * Get price from Chainlink or fallback to CoinGecko
 * @param {string} cryptoId - CoinGecko crypto ID
 * @param {Object} provider - Ethers provider
 * @param {string} network - 'testnet' or 'mainnet'
 * @param {Function} coingeckoFallback - Function to call CoinGecko if Chainlink fails
 * @returns {Promise<number|null>} Price in USD
 */
async function getPrice(cryptoId, provider, network = 'testnet', coingeckoFallback = null) {
  // Try Chainlink first if available
  if (hasChainlinkFeed(cryptoId, network)) {
    const chainlinkPrice = await getPriceFromChainlink(cryptoId, provider, network);
    if (chainlinkPrice !== null) {
      console.log(`✅ Got price from Chainlink for ${cryptoId}: $${chainlinkPrice}`);
      return chainlinkPrice;
    }
    console.log(`⚠️  Chainlink price failed for ${cryptoId}, falling back to CoinGecko`);
  } else {
    console.log(`ℹ️  No Chainlink feed for ${cryptoId}, using CoinGecko`);
  }

  // Fallback to CoinGecko
  if (coingeckoFallback) {
    try {
      const priceData = await coingeckoFallback([cryptoId], 'usd', false);
      const price = priceData[0]?.price;
      if (price) {
        console.log(`✅ Got price from CoinGecko for ${cryptoId}: $${price}`);
        return price;
      }
    } catch (error) {
      console.error(`❌ CoinGecko fallback failed for ${cryptoId}:`, error.message);
    }
  }

  return null;
}

module.exports = {
  getPriceFeedAddress,
  hasChainlinkFeed,
  getPriceFromChainlink,
  getPrice,
  SUPPORTED_CRYPTOS: Object.keys(TESTNET_PRICE_FEEDS)
};

