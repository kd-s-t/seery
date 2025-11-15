# Express.js Backend

Node.js API server for Seery prediction market platform.

## Installation

**1. Install dependencies:**
```bash
npm install
```

**2. Set up environment variables:**

Create a `.env` file in the `expressjs/` folder:
```env
OPENAI_API_KEY=your-openai-api-key-here
PORT=3016

# Blockchain Configuration
BLOCKCHAIN_NETWORK=testnet  # or 'mainnet' (also accepts NETWORK as fallback)
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BNB_MAINNET_RPC=https://bsc-dataseed.binance.org/
BLOCKCHAIN_RPC=https://data-seed-prebsc-1-s1.binance.org:8545  # Optional, used for localhost/local network

# Contract Address (use one of these - checked in order):
BLOCKCHAIN_CONTRACT_ADDRESS=0x...  # Primary (recommended)
# OR MAIN_CONTRACT_ADDRESS=0x...
# OR PREDICTION_STAKING_ADDRESS=0x...
# OR CONTRACT_ADDRESS=0x...  # Fallback for compatibility

PREDICTION_TRACKER_ADDRESS=0x...  # Optional, for on-chain prediction tracking
PRIVATE_KEY=your-private-key  # Optional, required for automated transactions (on-chain recording/staking)
BLOCKCHAIN_PRIVATE_KEY=your-private-key  # Alternative name (also accepts PRIVATE_KEY)

# AI Configuration
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4-turbo for better results

# Binance Trading API (optional)
BINANCE_API_KEY=your-binance-api-key
BINANCE_SECRET_KEY=your-binance-secret-key
BINANCE_TESTNET=true  # Set to true for testnet, false for production
```

**3. Deploy Smart Contract:**

Before starting the backend, deploy the smart contract:
```bash
cd ../bnb
npm run compile
npm run deploy
```

Copy the deployed contract address to your `.env` file.

## Running

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server runs on `http://localhost:3016`

## Environment Variables

Required variables:
- `OPENAI_API_KEY` - Required for AI features (market generation and resolution)
- Contract address (one of these, checked in order):
  - `BLOCKCHAIN_CONTRACT_ADDRESS` - Primary (recommended)
  - `MAIN_CONTRACT_ADDRESS` - Alternative
  - `PREDICTION_STAKING_ADDRESS` - Alternative
  - `CONTRACT_ADDRESS` - Fallback for compatibility
- Network (one of these):
  - `BLOCKCHAIN_NETWORK` - Primary (recommended): `testnet` or `mainnet`
  - `NETWORK` - Fallback: `testnet` or `mainnet`
- `PORT` - Server port (default: 3016)

Optional variables:
- `BNB_TESTNET_RPC` - BNB Chain testnet RPC URL
- `BNB_MAINNET_RPC` - BNB Chain mainnet RPC URL
- `BLOCKCHAIN_RPC` - RPC URL for localhost/local network
- `PREDICTION_TRACKER_ADDRESS` - PredictionTracker contract address (for on-chain prediction tracking)
- `PRIVATE_KEY` or `BLOCKCHAIN_PRIVATE_KEY` - For automated transactions (required for on-chain prediction recording)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-3.5-turbo)
- `BINANCE_API_KEY` - Binance API key for trading (optional)
- `BINANCE_SECRET_KEY` - Binance secret key for trading (optional)
- `BINANCE_TESTNET` - Use Binance testnet (default: true if API key not set)

## API Endpoints

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market
- `POST /api/markets/:id/bet` - Place a bet
- `POST /api/markets/:id/resolve` - Resolve a market
- `GET /api/markets/:id/bets` - Get all bets for a market

### AI Features
- `POST /api/ai/generate-markets` - Generate markets from news
- `POST /api/ai/analyze-news` - Analyze news and suggest markets
- `GET /api/markets/:id/ai-resolution` - Get AI resolution suggestion

### Trading (Binance)
- `POST /api/trading/buy` - Place a buy order
- `POST /api/trading/sell` - Place a sell order
- `GET /api/trading/account` - Get account information
- `GET /api/trading/price?symbol=BTCUSDT` - Get current price

### User Data
- `GET /api/users/:address/bets` - Get user's betting history

### Config
- `GET /api/config` - Get frontend configuration (contract address, network)

## Testing

```bash
npm test
```

## Project Structure

```
expressjs/
├── server.js         # Express API server
├── ai-service.js     # OpenAI integration
├── database.js       # SQLite database operations
├── prompts.js        # AI prompt templates
├── lib/              # Library modules
│   ├── binance/      # BNB Chain & Binance integration
│   │   ├── provider.js           # Blockchain provider setup
│   │   ├── contract.js           # PredictionMarket contract
│   │   ├── predictionTracker.js # PredictionTracker contract
│   │   ├── predictionStaking.js # PredictionStaking contract
│   │   ├── utils.js              # Utility functions
│   │   └── index.js              # Binance trading API
│   ├── coingecko/    # CoinGecko API
│   ├── openai/       # OpenAI integration
│   └── news/         # News fetching
├── tests/            # Test suite
└── docs/             # Documentation
```

See main [README.md](../README.md) for full project documentation.

