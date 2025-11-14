# End-to-End Testing Guide

This directory contains CLI scripts for testing the Seer prediction staking system end-to-end on a local Hardhat node.

## Prerequisites

1. **Docker & Docker Compose** - For running the local blockchain node
2. **Node.js** - For running Hardhat scripts
3. **Hardhat** - Already installed in this project

## Setup

### 1. Start the Local Blockchain Node

The Hardhat node runs in a Docker container. Start it with:

```bash
# From project root
docker-compose up -d bnb
```

Or if the container is already running:

```bash
docker-compose restart bnb
```

Verify the node is running:

```bash
curl http://localhost:8545
```

### 2. Deploy the Contract

Deploy the PredictionStaking contract to the local node:

```bash
cd bnb
npx hardhat run scripts/deployPredictions.js --network localhost
```

This will output the contract address. Make sure to add it to:
- `expressjs/.env` as `PREDICTION_STAKING_ADDRESS`
- `nextjs/.env.local` as `NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS`

### 3. Fund Test Wallets (Optional)

Fund a specific address with BNB for testing:

```bash
cd bnb
docker exec seer-bnb-1 npx hardhat run scripts/fund-wallet.js --network localhost
```

Or modify `scripts/fund-wallet.js` to fund a different address.

## Available Test Scripts

### 1. Record Prediction and Stake

Records a new prediction on-chain and stakes on it.

**Usage:**
```bash
cd bnb
CRYPTO_ID=<crypto> \
CURRENT_PRICE=<price> \
PREDICTED_PRICE=<price> \
DIRECTION=<up|down> \
PERCENT_CHANGE=<percent> \
STAKE_AMOUNT=<bnb> \
STAKE_UP=<true|false> \
npx hardhat run scripts/recordAndStake.js --network localhost
```

**Parameters:**
- `CRYPTO_ID` - Crypto identifier (e.g., "bitcoin", "ethereum", "binancecoin")
- `CURRENT_PRICE` - Current price in USD (e.g., "961.5")
- `PREDICTED_PRICE` - Predicted price in USD (e.g., "1026.88")
- `DIRECTION` - Prediction direction: "up" or "down"
- `PERCENT_CHANGE` - Percentage change (e.g., "6.8" for 6.8%)
- `STAKE_AMOUNT` - Amount to stake in BNB (e.g., "0.1")
- `STAKE_UP` - Stake direction: "true" for UP, "false" for DOWN

**Example:**
```bash
CRYPTO_ID=bitcoin \
CURRENT_PRICE=45000 \
PREDICTED_PRICE=48000 \
DIRECTION=up \
PERCENT_CHANGE=6.67 \
STAKE_AMOUNT=0.1 \
STAKE_UP=true \
npx hardhat run scripts/recordAndStake.js --network localhost
```

**What it does:**
1. Records a prediction on-chain
2. Automatically finds the prediction ID (by testing if needed)
3. Stakes the specified amount on the prediction
4. Displays transaction hashes and confirmation

**Output:**
```
============================================================
Record Prediction and Stake
============================================================
Parameters:
  Crypto ID: bitcoin
  Current Price: $45000
  Predicted Price: $48000
  Direction: up
  Percent Change: 6.67%
  Stake Amount: 0.1 BNB
  Stake Direction: UP

Step 1: Recording prediction...
  ✅ Transaction confirmed in block: 15
  ✅ Found valid prediction ID 1 by testing

Step 2: Staking on prediction...
  ✅ Transaction confirmed in block: 16

============================================================
✅ SUCCESS!
============================================================
Prediction ID: 1
Staked: 0.1 BNB (UP)
Record TX: 0x0f54d0f2d47203b57e5c16a494c491f701eaab78fb78808785b4b842075318a1
Stake TX: 0x987d913d8b446a6a1067ee602b60b2ce8f597076d14880377d345b005fb9d025
============================================================
```

### 2. Get User Stakes

Retrieves all stakes for a specific user address.

**Usage:**
```bash
cd bnb
USER_ADDRESS=<address> npx hardhat run scripts/getUserStakes.js --network localhost
```

**Parameters:**
- `USER_ADDRESS` - Ethereum address to query (defaults to test address if not provided)

**Example:**
```bash
USER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
npx hardhat run scripts/getUserStakes.js --network localhost
```

**What it does:**
1. Queries `getStakesByUser` for detailed stake information
2. Falls back to `getUserStakedPredictions` if detailed function unavailable
3. Displays all stakes with full details

**Output (with stakes):**
```
✅ User has 1 stake(s)

Detailed Stake Information:
================================================================================

Stake 1:
  Prediction ID: 1
  Crypto ID: bitcoin
  Direction: up
  Current Price: $45000.0
  Predicted Price: $48000.0
  Percent Change: 6.67%
  Your Stake UP: 0.1 BNB
  Your Stake DOWN: 0.0 BNB
  Total Staked UP: 0.1 BNB
  Total Staked DOWN: 0.0 BNB
  Verified: No
  Created: 2024-01-15T10:30:00.000Z
  Expires: 2024-01-16T10:30:00.000Z

================================================================================
```

**Output (no stakes):**
```
✅ User has no stakes (empty result)

No stakes found for this address.

✅ Query complete!
```

### 3. Fund Wallet

Funds a specific address with BNB on the local Hardhat node.

**Usage:**
```bash
cd bnb
docker exec seer-bnb-1 npx hardhat run scripts/fund-wallet.js --network localhost
```

**What it does:**
- Sends 300 BNB from the first Hardhat account to the specified recipient address
- Default recipient: `0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae`
- Modify the script to change the recipient address

**Output:**
```
Connecting to Hardhat node...
Connected to network: hardhat Chain ID: 31337
Sender address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Sending 300 BNB to: 0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae
Transaction hash: 0x...
✅ Funding complete!
```

### 4. Deploy Predictions Contract

Deploys the PredictionStaking contract to the local network.

**Usage:**
```bash
cd bnb
npx hardhat run scripts/deployPredictions.js --network localhost
```

**Output:**
```
Deploying Prediction contracts...

1. Deploying PredictionStaking...
✅ PredictionStaking deployed to: 0xc9654ddd1dCEd4423c959Efebb83043f7F31F512

============================================================
DEPLOYMENT COMPLETE
============================================================
Network: localhost

Add this to your expressjs/.env file:
PREDICTION_STAKING_ADDRESS=0xc9654ddd1dCEd4423c959Efebb83043f7F31F512

Add this to your nextjs/.env.local file:
NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS=0xc9654ddd1dCEd4423c959Efebb83043f7F31F512
============================================================
```

### 5. Check Address

Checks deployment information and provides guidance on finding contract addresses.

**Usage:**
```bash
cd bnb
npx hardhat run scripts/checkAddress.js --network localhost
```

## Complete E2E Test Flow

Here's a complete end-to-end test scenario:

### Step 1: Start Services
```bash
# Start blockchain node
docker-compose up -d bnb

# Wait a few seconds for node to start
sleep 5
```

### Step 2: Deploy Contract
```bash
cd bnb
npx hardhat run scripts/deployPredictions.js --network localhost
# Copy the contract address to your .env files
```

### Step 3: Fund Test Wallet (Optional)
```bash
cd bnb
docker exec seer-bnb-1 npx hardhat run scripts/fund-wallet.js --network localhost
```

### Step 4: Record Prediction and Stake
```bash
cd bnb
CRYPTO_ID=bitcoin \
CURRENT_PRICE=45000 \
PREDICTED_PRICE=48000 \
DIRECTION=up \
PERCENT_CHANGE=6.67 \
STAKE_AMOUNT=0.1 \
STAKE_UP=true \
npx hardhat run scripts/recordAndStake.js --network localhost
```

### Step 5: Verify Stakes
```bash
cd bnb
USER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
npx hardhat run scripts/getUserStakes.js --network localhost
```

## Environment Variables

The scripts automatically load environment variables from `expressjs/.env`. Key variables:

- `PREDICTION_STAKING_ADDRESS` - Contract address (required)
- `USER_ADDRESS` - Default user address for testing (optional)

## Troubleshooting

### "Hardhat node is not running!"
```bash
# Start the node
docker-compose up -d bnb

# Or restart if already running
docker-compose restart bnb
```

### "PREDICTION_STAKING_ADDRESS not set"
1. Deploy the contract first: `npx hardhat run scripts/deployPredictions.js --network localhost`
2. Add the address to `expressjs/.env`

### "Could not determine prediction ID"
- The transaction succeeded but the prediction ID couldn't be extracted
- This happens when the contract returns an existing prediction without emitting an event
- The script will try to find the ID by testing prediction IDs 1-10
- If it still fails, check the transaction hash manually

### "Insufficient balance"
- Fund your test account using `fund-wallet.js`
- Or use a different account with sufficient balance

### "replacement transaction underpriced"
- This happens when multiple transactions are sent with the same nonce
- Wait for pending transactions to confirm
- Or restart the Hardhat node to reset nonces

## Network Information

- **Local Hardhat Node**: `http://localhost:8545`
- **Chain ID**: `31337`
- **Default Accounts**: Hardhat provides 20 test accounts with 10,000 ETH each
- **Block Time**: Instant (mines on demand)

## Additional Notes

- All scripts use the first Hardhat account (`accounts[0]`) by default
- Transaction confirmations are instant on the local node
- The local node persists state between restarts (unless you reset it)
- To reset the node: `docker-compose down bnb && docker-compose up -d bnb`

## Script Development

When creating new test scripts:

1. Load environment variables using the `loadEnv()` function pattern
2. Connect to the provider: `hre.ethers.provider`
3. Get signers: `await hre.ethers.getSigners()`
4. Use the contract address from `process.env.PREDICTION_STAKING_ADDRESS`
5. Handle errors gracefully with helpful messages
6. Display clear output with transaction hashes and confirmation status

## See Also

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- Main project README for overall architecture

