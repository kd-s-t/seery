# 🔮 Seer

An AI-powered prediction market platform built for the Seedify Predictions Market Hackathon. This platform combines AI intelligence with blockchain technology to create, manage, and resolve prediction markets faster than traditional oracle-based systems.

## 📦 Project Structure

This repository contains the backend. The frontend is in a separate repository:
- **Backend** (this repo): Node.js API server, smart contracts, and blockchain integration
- **Frontend** (`../seer`): React SPA application

## 🎯 Project Overview

**Seer** is a decentralized prediction market platform that leverages:
- **AI-Assisted Market Creation**: Automatically generates tradeable markets from news and current events
- **AI-Powered Resolution**: Provides faster market resolution using AI analysis instead of waiting 24-48 hours for traditional oracles
- **BNB Chain Integration**: All markets and bets are settled on BNB Chain
- **User-Friendly Interface**: Modern web interface with MetaMask wallet integration

### Key Features

✅ **AI Market Generation**: Automatically create markets from news articles  
✅ **Fast AI Resolution**: Resolve markets in minutes instead of days  
✅ **On-Chain Settlement**: All bets and payouts on BNB Chain  
✅ **Real-Time Updates**: Live market data and pool sizes  
✅ **Revenue Model**: 2% platform fee on all winning bets  
✅ **Fully On-Chain**: All market data stored on blockchain (no database)  

## 🏆 Hackathon Alignment

This project addresses several YZi Labs Preferred Project opportunities:

1. **AI-Assisted Oracles**: Faster resolution than UMA's 24-48h optimistic oracle
2. **Subjective Predictions**: AI can resolve subjective or multi-stage predictions
3. **Better UX**: Modern web interface makes prediction markets feel like normal apps
4. **Revenue Focus**: Platform fees create sustainable business model

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- MetaMask browser extension
- BNB Chain testnet BNB (for testing)
- OpenAI API key (for AI features)

### Installation

1. **Clone and install dependencies:**

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd ../seer
npm install
```

2. **Set up environment variables:**

Create a `.env` file:
```env
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-key-here

# Server Configuration
PORT=3000
NETWORK=testnet  # or 'mainnet'

# BNB Chain Configuration (optional - for on-chain features)
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BNB_MAINNET_RPC=https://bsc-dataseed.binance.org/
CONTRACT_ADDRESS=0x...  # Deploy contract first (see below)
PRIVATE_KEY=your-private-key  # For automated transactions (optional)

# AI Model (optional)
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4-turbo for better results
```

3. **Deploy Smart Contract (optional):**

```bash
# Compile contract
npm run compile

# Deploy to BNB Testnet
npm run deploy
```

Copy the deployed contract address to your `.env` file.

4. **Start the backend server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```
The backend runs on `http://localhost:3000`

5. **Start the frontend (in a new terminal):**
```bash
cd ../seer
npm start
```
The frontend runs on `http://localhost:3001` and automatically opens in your browser

## 📖 Usage

### Creating Markets

1. **Manual Creation:**
   - Connect your MetaMask wallet
   - Enter a question (e.g., "Will Bitcoin reach $100k by end of 2024?")
   - Add outcomes (comma-separated, e.g., "Yes, No")
   - Set duration (1-168 hours)
   - Click "Create Market"

2. **AI-Generated Markets:**
   - Click "🤖 Generate with AI" button
   - AI will suggest markets based on current news
   - Review and create the suggested market

### Placing Bets

1. Browse active markets
2. Select an outcome
3. Enter bet amount (minimum 0.001 BNB)
4. Click "Bet"
5. Confirm transaction in MetaMask

### Resolving Markets

Markets can be resolved:
- **Manually**: By the market creator after the end time
- **AI-Assisted**: Use AI to suggest the winning outcome
- **Automatically**: After end time (if configured)

### API Endpoints

#### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market
- `POST /api/markets/:id/bet` - Place a bet
- `POST /api/markets/:id/resolve` - Resolve a market
- `GET /api/markets/:id/bets` - Get all bets for a market

#### AI Features
- `POST /api/ai/generate-markets` - Generate markets from news
- `POST /api/ai/analyze-news` - Analyze news and suggest markets
- `GET /api/markets/:id/ai-resolution` - Get AI resolution suggestion

#### User Data
- `GET /api/users/:address/bets` - Get user's betting history

## 🧪 Testing

### Smart Contract Tests (Hardhat)

Hardhat provides a local blockchain network for fast contract testing:

```bash
# Run all contract tests
npm run test:contracts

# Run with coverage report
npm run test:coverage

# Start local Hardhat node (for manual testing)
npm run node
```

**Contract tests cover:**
- ✅ Market creation and validation
- ✅ Betting functionality
- ✅ Market resolution
- ✅ Winner payouts and platform fees
- ✅ Edge cases and security

**Why Hardhat?**
- 🚀 **Fast**: Runs tests on local blockchain (no network delays)
- 🧪 **Isolated**: Each test gets a fresh state
- 💰 **Free**: No gas costs for testing
- 🔍 **Debugging**: Built-in stack traces and error messages
- 📊 **Coverage**: See which code paths are tested

### API & Integration Tests

```bash
# Run Node.js API tests
npm test
```

**Tests cover:**
- Database operations (markets, bets, resolutions)
- AI service functionality
- API endpoints (if server is running)

## 📁 Project Structure

```
├── contracts/
│   └── PredictionMarket.sol    # Smart contract for BNB Chain
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── PredictionMarket.test.js # Smart contract tests
├── docs/                        # Documentation
├── blockchain.js                # BNB Chain integration
├── ai-service.js                # AI market generation & resolution
├── server.js                    # Express API server
└── package.json
```

## 🔧 Technical Stack

- **Backend**: Node.js, Express.js
- **Blockchain**: Solidity, Hardhat, ethers.js
- **AI**: OpenAI GPT-3.5/GPT-4
- **Frontend**: React 19, ethers.js
- **Wallet**: MetaMask integration
- **Storage**: Fully on-chain (BNB Chain smart contracts)

## 💰 Revenue Model

- **Platform Fee**: 2% of all winning bet payouts
- **Market Creation**: Free (can add fees in future)
- **AI Features**: Powered by OpenAI API (costs covered by platform fees)

## 🎯 Submission Requirements

### ✅ Completed

- [x] **Public Code Repo**: All code is in this repository
- [x] **Working Prototype**: 
  - [x] User interaction (React web interface with wallet connection)
  - [x] AI integration (market generation and resolution)
  - [x] Blockchain integration (BNB Chain smart contracts - fully on-chain)
- [x] **Tests**: Basic test suite included
- [x] **BNB Chain**: All contracts deployable to BNB Chain

### 📝 Project Description (150 words)

**Seer** is a decentralized prediction platform on BNB Chain that uses AI to create markets from news and resolve them faster than traditional oracles. Unlike UMA's 24-48h optimistic oracle, our AI-assisted resolution provides near-instant results while maintaining accuracy through evidence-based analysis. The platform automatically generates tradeable markets from current events, allows users to bet on outcomes, and uses AI to suggest resolutions based on verifiable facts. All bets and payouts are settled on-chain with a 2% platform fee. The modern web interface makes prediction markets accessible to non-technical users, addressing the UX gap in current DeFi prediction markets. Revenue is generated through platform fees, creating a sustainable business model.

### 👥 Team Info (150 words)

[Add your team information here]

## 🚀 Future Enhancements

- [ ] Account abstraction for gasless transactions
- [ ] Mobile app
- [ ] Advanced AI models for better predictions
- [ ] Liquidity pools for market making
- [ ] Social features (following traders, market discussions)
- [ ] Multi-chain support
- [ ] NFT rewards for top traders

## 📄 License

ISC

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 📧 Contact

[Add your contact information]

---

**Built for Seedify Predictions Market Hackathon (Powered by BNB Chain)**
