# 🔮 Seer

AI-powered prediction market platform built for the Seedify Predictions Market Hackathon.

## 📦 Monorepo Structure

```
seer/
├── frontend/          # React SPA
├── backend/           # Node.js API + AI service
└── smartcontracts/   # Solidity contracts + Hardhat
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MetaMask browser extension
- BNB Chain testnet BNB
- OpenAI API key

### Installation

**1. Install all dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Smart Contracts
cd ../smartcontracts
npm install
```

**2. Set up environment:**

Backend `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
PORT=3000
NETWORK=testnet
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
CONTRACT_ADDRESS=0x...
```

Frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:3000
```

**3. Deploy Smart Contract:**
```bash
cd smartcontracts
npm run compile
npm run deploy
```

**4. Start Services:**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

## 🏗️ Project Structure

- **Frontend**: React 19 + ethers.js + MetaMask
- **Backend**: Express.js + OpenAI API + Blockchain integration
- **Smart Contracts**: Solidity 0.8.20 + Hardhat

## 📖 Documentation

See `backend/docs/` for:
- Hackathon requirements
- Tech stack details
- Testing guide
- Submission checklist

## 🐳 Docker (Optional)

```bash
docker-compose up
```

## 🧪 Testing

```bash
# Smart contracts
cd smartcontracts
npm test

# Backend
cd backend
npm test
```

## 📄 License

ISC

---

**Built for Seedify Predictions Market Hackathon**

