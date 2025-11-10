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

async function fetchCryptoPrices(symbols) {
  try {
    const ids = symbols.join(',');
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    
    const data = response.data;
    
    return symbols.map(symbol => {
      const coinData = data[symbol];
      if (!coinData) return null;
      
      return {
        id: symbol,
        symbol: SYMBOL_MAP[symbol] || symbol.toUpperCase(),
        name: symbol.charAt(0).toUpperCase() + symbol.slice(1).replace(/-/g, ' '),
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    throw error;
  }
}

module.exports = {
  fetchCryptoPrices
};

