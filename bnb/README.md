# BNB Chain Smart Contracts

Solidity smart contracts for Seer prediction market platform.

## Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Compile:**
```bash
npm run compile
```

**3. Deploy:**
```bash
npm run deploy
```

**4. Test:**
```bash
npm test
```

## Environment Variables

Set in `.env`:
- `PRIVATE_KEY` - Deployer wallet private key
- `BNB_TESTNET_RPC` - BNB Chain testnet RPC URL
- `CONTRACT_ADDRESS` - Deployed contract address (after deployment)

## Networks

- Testnet: `npm run deploy` (uses bnbTestnet)
- Mainnet: `hardhat run scripts/deploy.js --network bnbMainnet`

See main README.md for full documentation.

