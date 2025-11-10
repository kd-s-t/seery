# BNB Chain Utilization Guide

This document outlines strategies to better leverage BNB Chain's capabilities for the Seer prediction market platform.

## Current State

**What we're storing on-chain:**
- Market data (question, outcomes, creator, end time)
- Individual bets (user address → outcome → amount)
- Outcome pools (total BNB per outcome)
- User balances (claimable winnings)
- Platform fees (2% on payouts)

**What we're NOT utilizing:**
- Oracle integrations
- Event-based indexing
- IPFS for metadata
- Staking/rewards
- NFTs
- DeFi protocols
- Cross-chain bridges

---

## 1. Oracle Integration (Auto-Resolution)

### Overview
Use Chainlink Price Feeds on BNB Chain to automatically resolve crypto price prediction markets.

### Implementation

```solidity
// contracts/PredictionMarketOracle.sol
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PredictionMarketOracle {
    // Chainlink price feeds on BNB Chain
    AggregatorV3Interface internal btcPriceFeed;
    AggregatorV3Interface internal ethPriceFeed;
    
    // BTC/USD: 0x264990fbd0A4796A3E3d8E37C4d5F87a3ECA5EBE (testnet)
    // ETH/USD: 0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7 (testnet)
    
    function resolvePriceMarket(
        uint256 marketId,
        address priceFeed,
        uint256 targetPrice,
        bool direction // true = above, false = below
    ) external {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = feed.latestRoundData();
        
        bool resolved = direction 
            ? uint256(price) >= targetPrice 
            : uint256(price) <= targetPrice;
            
        if (resolved) {
            resolveMarket(marketId, 0); // Outcome 0 = "Yes"
        } else {
            resolveMarket(marketId, 1); // Outcome 1 = "No"
        }
    }
}
```

### Benefits
- ✅ Trustless resolution for price-based markets
- ✅ No manual intervention needed
- ✅ Uses BNB Chain's native oracle infrastructure
- ✅ Reduces gas costs (no manual resolution needed)

### Supported Price Feeds (BNB Chain Testnet)
- BTC/USD: `0x264990fbd0A4796A3E3d8E37C4d5F87a3ECA5EBE`
- ETH/USD: `0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7`
- BNB/USD: `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526`
- LINK/USD: `0x81faeDDfeBc2F8Ac7493270E8510E3f3c85b2B40`

---

## 2. Event-Based Indexing

### Overview
Replace polling with real-time event listeners for better performance and lower costs.

### Current Problem
- Polling blockchain every few seconds
- High RPC call costs
- Delayed updates

### Implementation

```javascript
// expressjs/lib/blockchain/events.js
const { ethers } = require('ethers');

class EventListener {
  constructor(contract, provider) {
    this.contract = contract;
    this.provider = provider;
    this.listeners = new Map();
  }

  startListening() {
    // Market Created Events
    this.contract.on("MarketCreated", (marketId, creator, question, event) => {
      console.log(`New market created: ${marketId} by ${creator}`);
      // Emit to frontend via WebSocket
      // Update database
      // Notify users
    });

    // Bet Placed Events
    this.contract.on("BetPlaced", (marketId, better, outcome, amount, event) => {
      console.log(`Bet placed: ${better} bet ${amount} on market ${marketId}`);
      // Update market pools in real-time
      // Notify market creator
    });

    // Market Resolved Events
    this.contract.on("MarketResolved", (marketId, winningOutcome, event) => {
      console.log(`Market resolved: ${marketId}, winner: ${winningOutcome}`);
      // Calculate payouts
      // Notify winners
      // Update UI
    });
  }

  stopListening() {
    this.contract.removeAllListeners();
  }

  // Get historical events
  async getPastEvents(eventName, fromBlock, toBlock) {
    const filter = this.contract.filters[eventName]();
    return await this.contract.queryFilter(filter, fromBlock, toBlock);
  }
}
```

### Benefits
- ✅ Real-time updates (no polling delay)
- ✅ Lower RPC costs (only pay for events)
- ✅ Better user experience
- ✅ Scalable (handles high transaction volume)

### WebSocket Integration

```javascript
// Frontend: Real-time updates via WebSocket
const ws = new WebSocket('ws://localhost:3016/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'MarketCreated') {
    // Add new market to UI immediately
  }
  if (data.type === 'BetPlaced') {
    // Update market pools in real-time
  }
};
```

---

## 3. IPFS for Metadata

### Overview
Store large data (news articles, images, detailed descriptions) off-chain on IPFS, store hash on-chain.

### Implementation

```solidity
// contracts/PredictionMarket.sol
struct Market {
    uint256 id;
    address creator;
    string question;
    string[] outcomes;
    uint256 endTime;
    bool resolved;
    uint256 winningOutcome;
    uint256 totalPool;
    string ipfsHash; // NEW: Store metadata hash
    mapping(uint256 => uint256) outcomePools;
    mapping(address => mapping(uint256 => uint256)) bets;
}
```

### Backend Integration

```javascript
// expressjs/lib/ipfs/index.js
const { create } = require('ipfs-http-client');

class IPFSService {
  constructor() {
    this.ipfs = create({ 
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });
  }

  async uploadMarketMetadata(marketData) {
    const metadata = {
      question: marketData.question,
      description: marketData.description,
      newsArticles: marketData.newsArticles,
      images: marketData.images,
      aiAnalysis: marketData.aiAnalysis,
      timestamp: new Date().toISOString()
    };

    const result = await this.ipfs.add(JSON.stringify(metadata));
    return result.path; // IPFS hash
  }

  async getMarketMetadata(ipfsHash) {
    const chunks = [];
    for await (const chunk of this.ipfs.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  }
}
```

### Benefits
- ✅ Lower gas costs (store hash instead of large data)
- ✅ Store rich media (news articles, charts, images)
- ✅ Decentralized storage (no single point of failure)
- ✅ Immutable metadata (IPFS content addressing)

---

## 4. Staking & Rewards System

### Overview
Incentivize market creation and accurate predictions with staking and rewards.

### Implementation

```solidity
// contracts/PredictionMarketStaking.sol
contract PredictionMarketStaking {
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public marketCreationRewards;
    mapping(address => uint256) public predictionAccuracy;
    
    uint256 public constant STAKING_REWARD_RATE = 5; // 5% APY
    uint256 public constant MARKET_CREATION_REWARD = 0.01 ether;
    
    function stake() external payable {
        stakedAmount[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value);
    }
    
    function unstake(uint256 amount) external {
        require(stakedAmount[msg.sender] >= amount, "Insufficient stake");
        stakedAmount[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Unstaked(msg.sender, amount);
    }
    
    // Reward market creators
    function rewardMarketCreator(address creator) external {
        rewards[creator] += MARKET_CREATION_REWARD;
        marketCreationRewards[creator]++;
    }
    
    // Reward accurate predictors
    function rewardAccuratePredictor(address predictor, uint256 accuracy) external {
        uint256 reward = (accuracy * stakedAmount[predictor]) / 100;
        rewards[predictor] += reward;
        predictionAccuracy[predictor] = accuracy;
    }
    
    function claimRewards() external {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "No rewards");
        rewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
```

### Benefits
- ✅ Incentivizes market creation
- ✅ Rewards accurate predictions
- ✅ User retention
- ✅ Tokenomics and growth

---

## 5. NFT Achievements

### Overview
Mint NFTs for user milestones and achievements.

### Implementation

```solidity
// contracts/PredictionMarketNFTs.sol
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PredictionMarketNFTs is ERC721 {
    uint256 private _tokenIdCounter;
    
    mapping(address => bool) public hasCreated10Markets;
    mapping(address => bool) public hasWon5Markets;
    mapping(address => bool) public hasTopPredictor;
    
    function mintMarketCreatorNFT(address to) external {
        require(marketCreationCount[to] >= 10, "Need 10 markets");
        require(!hasCreated10Markets[to], "Already minted");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        hasCreated10Markets[to] = true;
    }
    
    function mintWinnerNFT(address to) external {
        require(winCount[to] >= 5, "Need 5 wins");
        require(!hasWon5Markets[to], "Already minted");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        hasWon5Markets[to] = true;
    }
}
```

### NFT Types
- 🏆 **Market Creator** - Created 10+ markets
- 🎯 **Top Predictor** - 80%+ accuracy
- 💰 **High Roller** - Bet 10+ BNB total
- 🔥 **Hot Streak** - Won 5 markets in a row
- 📊 **Analyst** - Created 50+ markets

### Benefits
- ✅ Gamification
- ✅ User engagement
- ✅ Collectibles
- ✅ Social proof

---

## 6. Multi-Sig Resolution

### Overview
Use multi-sig wallet for important market resolutions to prevent single point of failure.

### Implementation

```solidity
// contracts/PredictionMarketMultiSig.sol
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";

contract PredictionMarketMultiSig {
    GnosisSafe public multiSigWallet;
    uint256 public requiredSignatures = 3;
    uint256 public totalSigners = 5;
    
    mapping(uint256 => mapping(address => bool)) public signatures;
    mapping(uint256 => uint256) public signatureCount;
    
    function proposeResolution(uint256 marketId, uint256 outcome) external {
        require(isSigner[msg.sender], "Not a signer");
        require(!signatures[marketId][msg.sender], "Already signed");
        
        signatures[marketId][msg.sender] = true;
        signatureCount[marketId]++;
        
        if (signatureCount[marketId] >= requiredSignatures) {
            resolveMarket(marketId, outcome);
        }
    }
}
```

### Benefits
- ✅ More secure resolution
- ✅ Decentralized governance
- ✅ Prevents manipulation
- ✅ Trust and transparency

---

## 7. DeFi Integration

### Overview
Integrate with BNB Chain DeFi protocols for liquidity and yield.

### Opportunities

#### A. Liquidity Pools for Market Outcomes
```solidity
// Create AMM pools for each market outcome
// Users can trade outcome shares before resolution
// Similar to Polymarket
```

#### B. Yield Farming
```solidity
// Stake BNB in market pools
// Earn yield while waiting for resolution
// Integrate with PancakeSwap or Venus
```

#### C. Lending/Borrowing
```solidity
// Use winning positions as collateral
// Borrow against future payouts
// Integrate with Venus Protocol
```

### Benefits
- ✅ Additional liquidity
- ✅ Yield opportunities
- ✅ More use cases
- ✅ Ecosystem integration

---

## 8. Cross-Chain Bridges

### Overview
Bridge to other chains (Ethereum, Polygon, Arbitrum) for broader reach.

### Implementation

```solidity
// Use LayerZero or Celer Bridge
// Cross-chain market creation
// Multi-chain liquidity
```

### Benefits
- ✅ Broader user base
- ✅ Multi-chain liquidity
- ✅ Reduced gas costs (use L2s)
- ✅ Ecosystem expansion

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 weeks)
1. **Event-Based Indexing** ⚡
   - Replace polling with event listeners
   - Real-time updates
   - Lower costs

2. **IPFS Metadata** 📦
   - Store news/articles off-chain
   - Lower gas costs
   - Richer data

### Phase 2: Core Features (2-4 weeks)
3. **Oracle Integration** 🔗
   - Auto-resolve price markets
   - Trustless resolution
   - Better UX

4. **Staking Rewards** 💰
   - Incentivize participation
   - Tokenomics
   - Growth

### Phase 3: Advanced Features (1-2 months)
5. **NFT Achievements** 🏆
   - Gamification
   - User engagement

6. **Multi-Sig Resolution** 🔐
   - Security
   - Governance

7. **DeFi Integration** 🌊
   - Liquidity pools
   - Yield farming

8. **Cross-Chain Bridges** 🌉
   - Multi-chain support
   - Broader reach

---

## Resources

### BNB Chain Documentation
- [BNB Chain Docs](https://docs.bnbchain.org/)
- [BNB Chain Testnet](https://testnet.bnbchain.org/)

### Chainlink on BNB Chain
- [Chainlink BNB Chain Docs](https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain)
- [Price Feed Addresses](https://docs.chain.link/data-feeds/price-feeds/addresses)

### IPFS
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Infura IPFS](https://infura.io/product/ipfs)

### DeFi Protocols on BNB Chain
- [PancakeSwap](https://pancakeswap.finance/)
- [Venus Protocol](https://venus.io/)
- [Alpaca Finance](https://www.alpacafinance.org/)

---

## Next Steps

1. **Start with Event Listening** - Immediate performance improvement
2. **Add IPFS Support** - Lower gas costs for rich metadata
3. **Integrate Chainlink Oracles** - Auto-resolve price markets
4. **Implement Staking** - Incentivize growth

---

**Last Updated:** Based on current contract architecture and BNB Chain capabilities

