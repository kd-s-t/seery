const cron = require('node-cron');
require('dotenv').config();

const blockchain = require('../lib/blockchain');
const coingecko = require('../lib/coingecko/prices');
const chainlink = require('../lib/oracle/chainlink');
const pyth = require('../lib/oracle/pyth');

const AUTO_RESOLVE_ENABLED = process.env.AUTO_RESOLVE_ENABLED !== 'false';
const AUTO_RESOLVE_CRON = process.env.AUTO_RESOLVE_CRON || '0 * * * *';
const AUTO_RESOLVE_INTERVAL_HOURS = parseInt(process.env.AUTO_RESOLVE_INTERVAL_HOURS) || 1;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

async function autoResolveExpiredStakes() {
  try {
    console.log(`${colors.cyan}[${new Date().toLocaleString()}] Checking for expired stakes...${colors.reset}`);
    
    const allStakes = await blockchain.getAllStakes({ useCache: false });
    if (!allStakes || !allStakes.stakes) {
      console.log(`${colors.gray}   No stakes found${colors.reset}`);
      return { resolved: 0, failed: 0, total: 0, message: 'No stakes found' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiredStakes = allStakes.stakes.filter(stake => 
      !stake.rewarded && 
      Number(stake.expiresAt) <= now
    );
    
    if (expiredStakes.length === 0) {
      console.log(`${colors.green}   ✅ No expired stakes to resolve${colors.reset}`);
      return { resolved: 0, failed: 0, total: 0, message: 'No expired stakes to resolve' };
    }
    
    console.log(`${colors.blue}   Found ${expiredStakes.length} expired stake(s)${colors.reset}`);
    
    const contract = blockchain.getMainContract();
    if (!contract) {
      throw new Error('Contract not initialized. Check MAIN_CONTRACT_ADDRESS in .env');
    }
    
    const wallet = blockchain.getWallet();
    if (!wallet) {
      throw new Error('Wallet not initialized. Check PRIVATE_KEY in .env');
    }
    
    const provider = blockchain.getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    const { ethers } = require('ethers');
    const network = process.env.BLOCKCHAIN_NETWORK || process.env.NETWORK || 'testnet';
    
    let resolvedCount = 0;
    let failedCount = 0;
    const results = [];
    
    // Helper to sleep/delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Batch fetch all unique crypto prices at once to minimize API calls
    const uniqueCryptoIds = [...new Set(expiredStakes.map(s => s.cryptoId))];
    console.log(`${colors.blue}   Fetching prices for ${uniqueCryptoIds.length} unique cryptos...${colors.reset}`);
    
    const priceMap = new Map();
    
    // Separate cryptos by oracle availability (priority: Chainlink > Pyth > CoinGecko)
    const chainlinkCryptos = uniqueCryptoIds.filter(id => chainlink.hasChainlinkFeed(id, network));
    const pythCryptos = uniqueCryptoIds.filter(id => 
      !chainlink.hasChainlinkFeed(id, network) && pyth.hasPythFeed(id, network)
    );
    const coingeckoCryptos = uniqueCryptoIds.filter(id => 
      !chainlink.hasChainlinkFeed(id, network) && !pyth.hasPythFeed(id, network)
    );
    
    // Fetch Chainlink prices (no rate limits!) - Priority 1
    if (chainlinkCryptos.length > 0) {
      console.log(`${colors.blue}   Fetching ${chainlinkCryptos.length} prices from Chainlink oracles...${colors.reset}`);
      for (const cryptoId of chainlinkCryptos) {
        try {
          const price = await chainlink.getPriceFromChainlink(cryptoId, provider, network);
          if (price) {
            priceMap.set(cryptoId, price);
          }
        } catch (error) {
          console.error(`${colors.yellow}   ⚠️  Chainlink failed for ${cryptoId}: ${error.message}${colors.reset}`);
        }
      }
    }
    
    // Fetch Pyth Network prices (no rate limits!) - Priority 2
    if (pythCryptos.length > 0) {
      console.log(`${colors.blue}   Fetching ${pythCryptos.length} prices from Pyth Network...${colors.reset}`);
      try {
        const pythPrices = await pyth.getPricesFromPyth(pythCryptos, network);
        pythPrices.forEach((price, cryptoId) => {
          priceMap.set(cryptoId, price);
        });
        console.log(`${colors.green}   ✅ Fetched ${pythPrices.size} prices from Pyth${colors.reset}`);
      } catch (error) {
        console.error(`${colors.yellow}   ⚠️  Pyth Network failed: ${error.message}${colors.reset}`);
      }
    }
    
    // Fetch CoinGecko prices for remaining altcoins (with rate limiting) - Priority 3
    if (coingeckoCryptos.length > 0) {
      console.log(`${colors.blue}   Fetching ${coingeckoCryptos.length} prices from CoinGecko API...${colors.reset}`);
      try {
        // Fetch all prices in one batch call (much more efficient!)
        const allPriceData = await coingecko.fetchCryptoPrices(coingeckoCryptos, 'usd', false);
        allPriceData.forEach(crypto => {
          if (crypto && crypto.id && crypto.price) {
            priceMap.set(crypto.id, crypto.price);
          }
        });
        console.log(`${colors.green}   ✅ Fetched ${allPriceData.length} prices from CoinGecko${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}   ❌ Failed to fetch prices in batch: ${error.message}${colors.reset}`);
        // Fall back to individual requests if batch fails
      }
    }
    
    for (let i = 0; i < expiredStakes.length; i++) {
      const stake = expiredStakes[i];
      try {
        console.log(`${colors.cyan}   Resolving stake ${stake.stakeId} (${stake.cryptoId})...${colors.reset}`);
        
        // Try to get price from batch fetch first
        let actualPrice = priceMap.get(stake.cryptoId);
        
        // If not in batch, try oracles in priority order: Chainlink > Pyth > CoinGecko
        if (!actualPrice) {
          // Try Chainlink oracle first (no rate limits!)
          if (chainlink.hasChainlinkFeed(stake.cryptoId, network)) {
            console.log(`${colors.cyan}   Using Chainlink oracle for ${stake.cryptoId}...${colors.reset}`);
            actualPrice = await chainlink.getPriceFromChainlink(stake.cryptoId, provider, network);
            if (actualPrice) {
              priceMap.set(stake.cryptoId, actualPrice);
            }
          }
          
          // Try Pyth Network if Chainlink not available
          if (!actualPrice && pyth.hasPythFeed(stake.cryptoId, network)) {
            console.log(`${colors.cyan}   Using Pyth Network for ${stake.cryptoId}...${colors.reset}`);
            actualPrice = await pyth.getPriceFromPyth(stake.cryptoId, network);
            if (actualPrice) {
              priceMap.set(stake.cryptoId, actualPrice);
            }
          }
          
          // Fallback to CoinGecko if oracles not available or failed
          if (!actualPrice) {
            // Add delay between requests to avoid rate limiting (CoinGecko free tier: 10-50 calls/min)
            if (i > 0) {
              await sleep(3000); // 3 second delay between individual requests
            }
            
            console.log(`${colors.cyan}   Using CoinGecko API for ${stake.cryptoId}...${colors.reset}`);
            const priceData = await coingecko.fetchCryptoPrices([stake.cryptoId], 'usd', false);
            actualPrice = priceData[0]?.price;
            
            if (actualPrice) {
              priceMap.set(stake.cryptoId, actualPrice); // Cache for next time
            }
          }
        }
        
        if (!actualPrice) {
          console.log(`${colors.yellow}   ⚠️  Price not found for ${stake.cryptoId}, skipping${colors.reset}`);
          failedCount++;
          results.push({ stakeId: stake.stakeId, cryptoId: stake.cryptoId, status: 'failed', error: 'Price not found' });
          continue;
        }
        
        const actualPriceWei = ethers.parseUnits(actualPrice.toString(), 18);
        const tx = await contract.resolveStake(stake.stakeId, actualPriceWei);
        await tx.wait();
        
        resolvedCount++;
        console.log(`${colors.green}   ✅ Resolved stake ${stake.stakeId} with price $${actualPrice} (tx: ${tx.hash})${colors.reset}`);
        results.push({ stakeId: stake.stakeId, cryptoId: stake.cryptoId, status: 'resolved', price: actualPrice, txHash: tx.hash });
        
        blockchain.invalidateStakesCache();
        
        // Small delay after successful resolution
        await sleep(1000);
      } catch (error) {
        const errorMsg = error.message || error.toString();
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Rate Limit');
        
        if (isRateLimit) {
          console.error(`${colors.red}   ❌ Rate limited for stake ${stake.stakeId}. Waiting 60 seconds...${colors.reset}`);
          await sleep(60000); // Wait 60 seconds on rate limit
          // Retry once
          try {
            const priceData = await coingecko.fetchCryptoPrices([stake.cryptoId], 'usd', false);
            const actualPrice = priceData[0]?.price;
            if (actualPrice) {
              const actualPriceWei = ethers.parseUnits(actualPrice.toString(), 18);
              const tx = await contract.resolveStake(stake.stakeId, actualPriceWei);
              await tx.wait();
              resolvedCount++;
              console.log(`${colors.green}   ✅ Resolved stake ${stake.stakeId} after retry (tx: ${tx.hash})${colors.reset}`);
              results.push({ stakeId: stake.stakeId, cryptoId: stake.cryptoId, status: 'resolved', price: actualPrice, txHash: tx.hash });
              blockchain.invalidateStakesCache();
              continue;
            }
          } catch (retryError) {
            console.error(`${colors.red}   ❌ Retry failed for stake ${stake.stakeId}: ${retryError.message}${colors.reset}`);
          }
        }
        
        console.error(`${colors.red}   ❌ Failed to resolve stake ${stake.stakeId}: ${errorMsg}${colors.reset}`);
        failedCount++;
        results.push({ stakeId: stake.stakeId, cryptoId: stake.cryptoId, status: 'failed', error: errorMsg });
      }
    }
    
    console.log(`${colors.blue}📊 Resolution Summary:${colors.reset}`);
    console.log(`   Resolved: ${colors.green}${resolvedCount}${colors.reset}`);
    console.log(`   Failed: ${failedCount > 0 ? colors.red : colors.gray}${failedCount}${colors.reset}`);
    console.log(`   Total: ${expiredStakes.length}`);
    
    return {
      resolved: resolvedCount,
      failed: failedCount,
      total: expiredStakes.length,
      results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Error in auto-resolve: ${error.message}${colors.reset}`);
    console.error(error.stack);
    throw error;
  }
}

function startAutoResolve() {
  if (!AUTO_RESOLVE_ENABLED) {
    console.log(`${colors.yellow}⚠️  Auto-resolve is disabled (AUTO_RESOLVE_ENABLED=false)${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}🚀 Auto-Resolve Cron Job Started${colors.reset}`);
  console.log(`${colors.cyan}   Schedule: ${AUTO_RESOLVE_CRON}${colors.reset}`);
  console.log(`${colors.cyan}   Interval: Every ${AUTO_RESOLVE_INTERVAL_HOURS} hour(s)${colors.reset}`);
  console.log(`${colors.gray}   Press Ctrl+C to stop${colors.reset}\n`);
  
  cron.schedule(AUTO_RESOLVE_CRON, async () => {
    await autoResolveExpiredStakes();
  });
  
  if (process.env.AUTO_RESOLVE_RUN_ON_START === 'true') {
    console.log(`${colors.cyan}   Running initial check on startup...${colors.reset}\n`);
    autoResolveExpiredStakes();
  }
}

if (require.main === module) {
  startAutoResolve();
  
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}👋 Shutting down auto-resolve cron...${colors.reset}`);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n${colors.yellow}👋 Shutting down auto-resolve cron...${colors.reset}`);
    process.exit(0);
  });
}

module.exports = {
  startAutoResolve,
  autoResolveExpiredStakes
};

