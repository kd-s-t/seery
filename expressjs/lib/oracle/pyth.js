const axios = require('axios');

// Pyth Network Price Service API endpoints
const PYTH_API_BASE = {
  testnet: 'https://hermes.pyth.network/v2',
  mainnet: 'https://hermes.pyth.network/v2'
};

// Pyth price feed IDs (these are the actual feed IDs from Pyth Network)
// Format: ASSET/USD
const PYTH_FEED_IDS = {
  'solana': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD
  'ripple': '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8', // XRP/USD
  'cardano': '0x2a01dea3cc397f6d19234d7a50a6c612b46fa4d3e5d87eb05563e5bc923225a1', // ADA/USD
  'avalanche-2': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb', // AVAX/USD
  'polygon': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696571fe46a3646bbfe22', // MATIC/USD
  'litecoin': '0x9e1932ea13c7946ffe65a82455ba7776327b74b8', // LTC/USD (placeholder)
  'dogecoin': '0xdcef50dd0a4c2ecc52f7c62d9c8a3c5e8a6c8c8c', // DOGE/USD (placeholder)
  'chainlink': '0x83be7ed74fd5c07b8e3c9add3c0c8b3e8b4e4e4e', // LINK/USD (placeholder)
};

/**
 * Check if a crypto has a Pyth price feed
 * @param {string} cryptoId - CoinGecko crypto ID
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {boolean}
 */
function hasPythFeed(cryptoId, network = 'testnet') {
  return PYTH_FEED_IDS[cryptoId] !== undefined;
}

/**
 * Get latest price from Pyth Network Price Service API
 * @param {string} cryptoId - CoinGecko crypto ID
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {Promise<number|null>} Price in USD or null if not available
 */
async function getPriceFromPyth(cryptoId, network = 'testnet') {
  try {
    const feedId = PYTH_FEED_IDS[cryptoId];
    if (!feedId) {
      return null;
    }

    const apiBase = PYTH_API_BASE[network] || PYTH_API_BASE.mainnet;
    
    // Pyth API endpoint for latest price - using price feeds endpoint
    const response = await axios.get(`${apiBase}/price_feeds/latest`, {
      params: {
        ids: feedId
      },
      timeout: 10000
    });

    if (!response.data || !response.data.price_feeds || response.data.price_feeds.length === 0) {
      return null;
    }

    const priceFeed = response.data.price_feeds[0];
    
    // Pyth returns price with exponent, convert to USD
    // price = price * 10^exponent
    if (!priceFeed.price || !priceFeed.price.price) {
      return null;
    }
    
    const price = Number(priceFeed.price.price);
    const expo = Number(priceFeed.price.exponent || -8); // Default to -8 if not provided
    const priceInUSD = price * Math.pow(10, expo);
    
    return priceInUSD;
  } catch (error) {
    console.error(`Error fetching Pyth price for ${cryptoId}:`, error.message);
    return null;
  }
}

/**
 * Get prices for multiple cryptos from Pyth Network
 * @param {string[]} cryptoIds - Array of CoinGecko crypto IDs
 * @param {string} network - 'testnet' or 'mainnet'
 * @returns {Promise<Map<string, number>>} Map of cryptoId -> price
 */
async function getPricesFromPyth(cryptoIds, network = 'testnet') {
  const priceMap = new Map();
  const feedIds = cryptoIds
    .filter(id => hasPythFeed(id, network))
    .map(id => ({ cryptoId: id, feedId: PYTH_FEED_IDS[id] }));

  if (feedIds.length === 0) {
    return priceMap;
  }

  try {
    const apiBase = PYTH_API_BASE[network] || PYTH_API_BASE.mainnet;
    const allFeedIds = feedIds.map(f => f.feedId);
    
    const response = await axios.get(`${apiBase}/price_feeds/latest`, {
      params: {
        ids: allFeedIds.join(',')
      },
      timeout: 10000
    });

    if (response.data && response.data.price_feeds) {
      // Create a map of feedId -> price
      const feedPriceMap = new Map();
      response.data.price_feeds.forEach(priceFeed => {
        if (priceFeed.price && priceFeed.price.price) {
          const price = Number(priceFeed.price.price);
          const expo = Number(priceFeed.price.exponent || -8);
          const priceInUSD = price * Math.pow(10, expo);
          feedPriceMap.set(priceFeed.id, priceInUSD);
        }
      });

      // Map back to cryptoIds
      feedIds.forEach(({ cryptoId, feedId }) => {
        const price = feedPriceMap.get(feedId);
        if (price) {
          priceMap.set(cryptoId, price);
        }
      });
    }
  } catch (error) {
    console.error(`Error fetching Pyth prices in batch:`, error.message);
  }

  return priceMap;
}

module.exports = {
  hasPythFeed,
  getPriceFromPyth,
  getPricesFromPyth,
  SUPPORTED_CRYPTOS: Object.keys(PYTH_FEED_IDS)
};

