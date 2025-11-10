const coingecko = require('../lib/coingecko/prices');
const openai = require('../lib/openai');

const getCryptoPrices = async (req, res) => {
  try {
    let symbols = req.query.symbols ? req.query.symbols.split(',').filter(Boolean) : null;
    const tags = req.query.tags ? req.query.tags.split(',').filter(Boolean) : null;
    const currency = req.query.currency || 'usd';
    const forceRefresh = !!req.query._t;
    
    if (forceRefresh) {
      console.log('Backend: Force refresh requested - bypassing cache');
    }
    
    // If tags are provided, use them instead of symbols
    let requestedSymbols = null;
    if (tags && tags.length > 0) {
      requestedSymbols = [...tags]; // Create a copy to ensure we have the exact list
      symbols = [...tags]; // Use tags as symbols
      console.log('Backend: Tags provided:', tags);
      console.log('Backend: Using tags for symbols:', symbols);
      console.log('Backend: Requested symbols set to:', requestedSymbols);
    } else if (!symbols || symbols.length === 0) {
      symbols = await coingecko.getTrendingCryptos();
      requestedSymbols = [...symbols];
      console.log('Backend: Using trending cryptos:', symbols);
    } else {
      requestedSymbols = [...symbols];
      console.log('Backend: Using provided symbols:', symbols);
    }
    
    console.log('Backend: Final requestedSymbols:', requestedSymbols);
    console.log('Backend: Final symbols to fetch:', symbols);
    
    const priceData = await coingecko.fetchCryptoPrices(symbols, currency, forceRefresh);
    
    console.log('Backend: Received priceData count:', priceData.length);
    console.log('Backend: Requested symbols:', requestedSymbols);
    console.log('Backend: PriceData IDs:', priceData.map(c => c.id));
    
    // STRICT Filter to only return cryptos that match the requested tags/symbols
    const requestedIds = new Set(requestedSymbols);
    console.log('Backend: Requested IDs Set:', Array.from(requestedIds));
    
    // Build a map of requested cryptos only
    const requestedCryptoMap = new Map();
    priceData.forEach(crypto => {
      if (requestedIds.has(crypto.id)) {
        requestedCryptoMap.set(crypto.id, crypto);
        console.log(`Backend: Including ${crypto.id} - in requested list`);
      } else {
        console.log(`Backend: EXCLUDING ${crypto.id} - NOT in requested list`);
      }
    });
    
    // Create final array in the exact order of requestedSymbols
    const finalData = requestedSymbols
      .map(id => requestedCryptoMap.get(id))
      .filter(Boolean); // Remove any undefined entries
    
    console.log('Backend: Final filtered data count:', finalData.length);
    console.log('Backend: Final filtered IDs:', finalData.map(c => c.id));
    
    // Final safety check - ensure we only return what was requested
    if (finalData.length !== requestedSymbols.length) {
      console.error(`Backend: ERROR - Filtered count (${finalData.length}) doesn't match requested count (${requestedSymbols.length})`);
      console.error('Backend: Requested:', requestedSymbols);
      console.error('Backend: Got:', finalData.map(c => c.id));
      console.error('Backend: Original priceData had:', priceData.map(c => c.id));
      console.error('Backend: RequestedCryptoMap has:', Array.from(requestedCryptoMap.keys()));
    }
    
    // Use finalData - guaranteed to only contain requested cryptos
    const dataToUse = finalData;
    
    // FINAL VERIFICATION - Double check we only have requested cryptos
    const finalIds = new Set(dataToUse.map(c => c.id));
    const requestedSet = new Set(requestedSymbols);
    const extraIds = Array.from(finalIds).filter(id => !requestedSet.has(id));
    if (extraIds.length > 0) {
      console.error('Backend: CRITICAL ERROR - Found extra cryptos in final data:', extraIds);
      // Remove any extra cryptos
      const cleanedData = dataToUse.filter(c => requestedSet.has(c.id));
      console.error('Backend: Cleaned data count:', cleanedData.length);
      dataToUse.length = 0;
      dataToUse.push(...cleanedData);
    }
    
    console.log('Backend: FINAL dataToUse count:', dataToUse.length);
    console.log('Backend: FINAL dataToUse IDs:', dataToUse.map(c => c.id));
    
    if (!process.env.OPENAI_API_KEY) {
      const response = {
        success: true,
        cryptos: dataToUse.map(crypto => ({
          ...crypto,
          suggestion: null,
          suggestionPercent: null,
          reasoning: 'AI features disabled. OPENAI_API_KEY not configured.'
        })),
        tags: tags || [],
        timestamp: new Date().toISOString()
      };
      console.log('Backend: Sending response with', response.cryptos.length, 'cryptos');
      return res.json(response);
    }
    
    const cryptosWithSuggestions = await Promise.all(
      dataToUse.map(async (crypto) => {
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
    
    const response = {
      success: true,
      cryptos: cryptosWithSuggestions,
      tags: tags || [],
      timestamp: new Date().toISOString()
    };
    console.log('Backend: Sending FINAL response with', response.cryptos.length, 'cryptos');
    console.log('Backend: FINAL response crypto IDs:', response.cryptos.map(c => c.id));
    res.json(response);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch crypto prices'
    });
  }
};

const searchCrypto = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    const results = await coingecko.searchCrypto(query);
    
    res.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching crypto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search crypto'
    });
  }
};

const getCryptoLibrary = async (req, res) => {
  try {
    const library = await coingecko.getCryptoLibrary();
    
    res.json({
      success: true,
      library,
      count: library.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto library:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch crypto library'
    });
  }
};

module.exports = {
  getCryptoPrices,
  searchCrypto,
  getCryptoLibrary
};

