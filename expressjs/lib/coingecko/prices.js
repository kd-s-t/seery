const axios = require('axios');

const SYMBOL_MAP = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'solana': 'SOL',
  'cardano': 'ADA',
  'polkadot': 'DOT',
  'chainlink': 'LINK',
  'avalanche-2': 'AVAX',
  'polygon': 'MATIC',
  'litecoin': 'LTC'
};

const TRENDING_CRYPTOS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'polkadot', 'chainlink', 'avalanche-2', 'polygon', 'litecoin'];

const priceCache = new Map();
const CACHE_TTL = 21600000;
const MAX_RETRIES = 1;
const RETRY_DELAY = 2000;

function getCacheKey(symbols, currency) {
  const sorted = [...symbols].sort().join(',');
  return `prices_${sorted}_${currency}`;
}

function getCachedUSDData(symbols) {
  const key = getCacheKey(symbols, 'usd');
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedUSDData(symbols, data) {
  const key = getCacheKey(symbols, 'usd');
  priceCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function convertUSDToPHP(usdData, usdToPhpRate) {
  return usdData.map(crypto => ({
    ...crypto,
    price: crypto.price * usdToPhpRate,
    currency: 'php'
  }));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTrendingCryptos() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/search/trending'
    );
    
    if (response.data && response.data.coins) {
      return response.data.coins.slice(0, 10).map(coin => coin.item.id);
    }
    return TRENDING_CRYPTOS;
  } catch (error) {
    console.error('Error fetching trending cryptos:', error);
    return TRENDING_CRYPTOS;
  }
}

async function getUSDToPHPRate() {
  try {
    const cached = priceCache.get('rate_usd_php');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000
    });
    
    const rate = response.data?.rates?.PHP;
    if (!rate || isNaN(rate)) {
      console.warn('Invalid PHP rate from API, using fallback');
      return 56.0;
    }
    
    priceCache.set('rate_usd_php', {
      data: rate,
      timestamp: Date.now()
    });
    
    return rate;
  } catch (error) {
    console.warn('Error fetching USD/PHP rate, using fallback:', error.message);
    return 56.0;
  }
}

async function fetchCryptoPrices(symbols, currency = 'usd', forceRefresh = false) {
  try {
    if (!symbols || symbols.length === 0) {
      return [];
    }
    
    console.log('fetchCryptoPrices: Requested symbols:', symbols);
    console.log('fetchCryptoPrices: forceRefresh:', forceRefresh);
    
    if (forceRefresh) {
      console.log('Force refresh: bypassing cache and fetching fresh data from CoinGecko');
      // Clear cache for these symbols to ensure fresh data
      const cacheKey = getCacheKey(symbols, 'usd');
      priceCache.delete(cacheKey);
      console.log('Force refresh: Cleared cache for key:', cacheKey);
    }
    
    let usdData = forceRefresh ? null : getCachedUSDData(symbols);
    
    if (usdData) {
      console.log('fetchCryptoPrices: Using cached data for symbols:', symbols);
    } else {
      console.log('fetchCryptoPrices: No cache found, fetching from API');
    }
    
    if (!usdData) {
      const ids = symbols.join(',');
      console.log('fetchCryptoPrices: Fetching from CoinGecko API with ids:', ids);
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 10000 }
      );
    
      if (!response.data) {
        throw new Error('No data received from CoinGecko API');
      }
      
      const data = response.data;
      console.log('fetchCryptoPrices: CoinGecko API returned data for:', Object.keys(data));
    
      usdData = symbols.map(symbol => {
        const coinData = data[symbol];
        if (!coinData) {
          console.warn(`No data for ${symbol}`);
          return null;
        }
      
        const usdPrice = coinData.usd;
        const change24h = coinData.usd_24h_change !== undefined ? coinData.usd_24h_change : 0;
        
        if (usdPrice === undefined || usdPrice === null) {
          console.warn(`No USD price for ${symbol}`);
          return null;
        }
      
        return {
          id: symbol,
          symbol: SYMBOL_MAP[symbol] || symbol.toUpperCase(),
          name: symbol.charAt(0).toUpperCase() + symbol.slice(1).replace(/-/g, ' '),
          price: usdPrice,
          change24h: change24h,
          currency: 'usd'
        };
      }).filter(Boolean);
      
      console.log('fetchCryptoPrices: Mapped usdData count:', usdData.length);
      console.log('fetchCryptoPrices: Mapped usdData IDs:', usdData.map(c => c.id));
      
      if (usdData.length > 0 && !forceRefresh) {
        setCachedUSDData(symbols, usdData);
      }
    }
    
    console.log('fetchCryptoPrices: Returning usdData count:', usdData.length);
    console.log('fetchCryptoPrices: Returning usdData IDs:', usdData.map(c => c.id));
    
    if (currency === 'php') {
      const usdToPhpRate = await getUSDToPHPRate();
      if (!usdToPhpRate || isNaN(usdToPhpRate)) {
        console.error('Invalid USD/PHP rate, returning USD data');
        return usdData;
      }
      return convertUSDToPHP(usdData, usdToPhpRate);
    }
    
    return usdData;
  } catch (error) {
    console.error('Error fetching crypto prices:', error.message);
    if (error.response) {
      console.error('API Status:', error.response.status);
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

async function searchCrypto(query) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    
    if (response.data && response.data.coins) {
      return response.data.coins.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        thumb: coin.thumb
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
}

async function getCryptoLibrary() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
    );
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        marketCap: coin.market_cap || 0
      })).sort((a, b) => b.marketCap - a.marketCap);
    }
    
    return TRENDING_CRYPTOS.map(id => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      symbol: SYMBOL_MAP[id] || id.toUpperCase(),
      marketCap: 0
    }));
  } catch (error) {
    console.error('Error fetching crypto library:', error);
    return TRENDING_CRYPTOS.map(id => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
      symbol: SYMBOL_MAP[id] || id.toUpperCase(),
      marketCap: 0
    }));
  }
}

module.exports = {
  fetchCryptoPrices,
  getTrendingCryptos,
  searchCrypto,
  getCryptoLibrary,
  TRENDING_CRYPTOS
};

