# Quick Contract Deployment Guide

## Problem
You're seeing: "Contract not deployed. Please deploy contract first."

## Solution: Deploy the Contract

### Step 1: Go to the contract directory
```bash
cd bnb
```

### Step 2: Install dependencies (if not done)
```bash
npm install
```

### Step 3: Set up your .env file
Create `bnb/.env`:
```env
PRIVATE_KEY=your-wallet-private-key-here
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
```

**Important:** You need:
- A wallet with testnet BNB (get from faucet)
- Your wallet's private key (export from MetaMask)

### Step 4: Compile the contract
```bash
npm run compile
```

### Step 5: Deploy to BNB Testnet
```bash
npm run deploy
```

This will output something like:
```
PredictionMarket deployed to: 0x1234567890abcdef1234567890abcdef12345678
Network: bnbTestnet

Add this to your .env file:
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### Step 6: Add contract address to backend .env
Create `expressjs/.env` (if it doesn't exist):
```env
PORT=3016
NETWORK=testnet
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BNB_MAINNET_RPC=https://bsc-dataseed.binance.org/
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678  # Paste the address from step 5
```

### Step 7: Restart your backend
```bash
cd expressjs
npm start
# or
npm run dev
```

### Step 8: Refresh your frontend
The contract should now be detected!

## Quick Test

After deployment, you can verify:
```bash
# Check contract on BSCScan testnet
# https://testnet.bscscan.com/address/YOUR_CONTRACT_ADDRESS
```

## Troubleshooting

### "Insufficient funds"
- Get testnet BNB from a faucet
- Check your wallet has enough BNB for gas

### "Private key not set"
- Make sure `PRIVATE_KEY` is in `bnb/.env`
- Never commit `.env` files to git!

### "Contract address not found"
- Make sure `CONTRACT_ADDRESS` is in `expressjs/.env`
- Restart the backend after adding it

## Need Testnet BNB?

1. Go to a BNB testnet faucet
2. Request testnet BNB to your wallet address
3. Wait for confirmation
4. Try deploying again

