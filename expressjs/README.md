# Express.js Backend

Node.js API server for Seer prediction market platform.

## Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Set up environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

**3. Run:**
```bash
npm start
# or for development:
npm run dev
```

Server runs on `http://localhost:3016`

## Environment Variables

See `.env.example` for required variables:
- `OPENAI_API_KEY` - Required for AI features
- `CONTRACT_ADDRESS` - Deployed smart contract address
- `NETWORK` - testnet or mainnet

## API Endpoints

- `GET /api/markets` - List markets
- `GET /api/markets/:id` - Get market details
- `POST /api/markets/:id/bet` - Place bet
- `POST /api/ai/generate-markets` - Generate markets from news
- `GET /api/config` - Get config for frontend

See main README.md for full documentation.

