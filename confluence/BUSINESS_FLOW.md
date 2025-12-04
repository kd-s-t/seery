# Business Flow & Revenue Model

This document outlines the complete business flow, revenue model, and how funds are distributed in the Seery prediction market platform.

## 📊 Overview

Seery is a decentralized prediction market platform where users stake BNB on cryptocurrency price predictions. The platform generates revenue through platform earnings when all bettors lose a stake.

## 💰 Revenue Model

### Platform Earnings

**How it works:**
- When **all bettors lose** a stake (no winners), their BNB stays in the contract as **platform earnings**
- The contract owner can withdraw these earnings using `withdrawPlatformEarnings()`
- This is the primary revenue source for the platform

**Example:**
- User A bets 0.1 BNB on "UP" for Bitcoin
- User B bets 0.05 BNB on "UP" for Bitcoin
- Both predictions are wrong → Bitcoin price goes DOWN
- Result: 0.15 BNB stays in contract as platform earnings

### No Platform Fee on Winners

- When there are winners, they receive their stake back + proportional share of losers' stakes
- No platform fee is deducted from winnings
- Platform only earns when everyone loses

## 🔄 Stake Resolution Flow

### Scenario 1: Winners and Losers Exist

**Flow:**
1. Multiple users stake on opposite directions (UP vs DOWN)
2. Stake expires and gets resolved with actual price
3. Winners are determined based on actual price direction
4. Winners receive: `Original Stake + (Original Stake × Losers' Pool / Winners' Pool)`
5. Losers receive: Nothing (their BNB goes to winners)

**Example:**
- User A: 0.1 BNB on UP
- User B: 0.05 BNB on DOWN
- Actual price goes UP
- User A wins: Gets 0.1 + (0.1 × 0.05 / 0.1) = **0.15 BNB**
- User B loses: Gets **0 BNB**
- Platform earnings: **0 BNB**

### Scenario 2: All Bettors Lose (No Winners)

**Flow:**
1. One or more users stake on the same direction
2. Stake expires and gets resolved
3. All stakers predicted incorrectly
4. **All BNB stays in contract as platform earnings**
5. Owner can withdraw via `withdrawPlatformEarnings()`

**Example:**
- User A: 0.1 BNB on UP
- User B: 0.05 BNB on UP
- Actual price goes DOWN
- User A loses: Gets **0 BNB**
- User B loses: Gets **0 BNB**
- Platform earnings: **0.15 BNB** (can be withdrawn by owner)

### Scenario 3: All Bettors Win (No Losers)

**Flow:**
1. Multiple users stake on the same direction
2. Stake expires and gets resolved
3. All stakers predicted correctly
4. Everyone gets their stake back
5. No platform earnings (no losers to take from)

**Example:**
- User A: 0.1 BNB on UP
- User B: 0.05 BNB on UP
- Actual price goes UP
- User A wins: Gets **0.1 BNB** (stake back)
- User B wins: Gets **0.05 BNB** (stake back)
- Platform earnings: **0 BNB**

## 🎯 Key Business Rules

### Minimum Stake
- **MIN_STAKE**: 0.00001 BNB
- Users cannot stake less than this amount

### Stake Expiry
- **STAKE_EXPIRY_WINDOW**: 24 hours
- Stakes expire 24 hours after creation
- Must be resolved after expiry to distribute funds

### Winner Determination
- If actual price > current price → "UP" stakers win
- If actual price ≤ current price → "DOWN" stakers win
- Winners are determined automatically based on price direction

### Reward Calculation
```
Winner Reward = Original Stake + (Original Stake × Total Losers Amount / Total Winners Amount)
```

This ensures:
- Winners get their stake back
- Winners get proportional share of losers' pool
- Larger stakes get larger rewards

## 💼 Platform Operations

### Withdrawing Platform Earnings

**Owner Functions:**
1. `getPlatformEarnings()` - Check contract balance
2. `withdrawPlatformEarnings()` - Withdraw all BNB to owner

**Usage:**
```bash
# Check earnings
npm run check:owner

# Withdraw earnings (testnet)
npm run withdraw:earnings

# Withdraw earnings (mainnet)
npm run withdraw:earnings:mainnet
```

### Auto-Resolution

**How it works:**
- Expired stakes are automatically resolved via EventBridge cron job
- Runs every hour to check for expired stakes
- Fetches actual prices from Chainlink, Pyth, or CoinGecko
- Resolves stakes and distributes rewards/earnings

**Cost:** FREE (EventBridge: 14M invocations/month free, hourly = ~720/month)

## 📈 Revenue Projections

### Assumptions
- Average stake: 0.1 BNB
- Stakes with no winners: 30% of all stakes
- Average users per stake: 2

### Monthly Revenue Estimate
```
Total Stakes: 1000/month
Stakes with no winners: 300/month
Average stake amount: 0.1 BNB
Average users per stake: 2

Monthly Revenue = 300 × 0.1 × 2 = 60 BNB/month
```

**Note:** Actual revenue depends on:
- User activity
- Prediction accuracy
- Number of users per stake
- Average stake amounts

## 🔐 Security & Access Control

### Owner-Only Functions
- `withdrawPlatformEarnings()` - Only contract owner can call
- Owner is set during contract deployment (deployer address)

### Contract Immutability
- Once deployed, contract logic cannot be changed
- Owner cannot modify stake resolution logic
- Ensures fairness and transparency

## 📊 Smart Contract Structure

### Main Contract Functions

**User Functions:**
- `createStake()` - Create a new prediction stake
- `stakeOnIt()` - Join an existing stake
- `getStakes()` - View all stakes
- `getUserStats()` - View user win/loss stats

**Owner Functions:**
- `withdrawPlatformEarnings()` - Withdraw platform earnings
- `getPlatformEarnings()` - Check earnings balance

**Resolution Functions:**
- `resolveStake()` - Resolve a single stake
- `resolveExpiredStakes()` - Resolve multiple stakes (batch)

## 🎯 Business Advantages

### For Users
- ✅ No platform fees on winnings
- ✅ Transparent on-chain resolution
- ✅ Fair reward distribution
- ✅ Instant payouts to winners

### For Platform
- ✅ Sustainable revenue model
- ✅ Earnings only when users lose (no fee on wins)
- ✅ Automated resolution via EventBridge
- ✅ Transparent and verifiable on-chain

## 📝 Contract Addresses

**Testnet:**
- Contract: `0x42067558c48f8c74C819461a9105CD47B90B098F`
- [BSCScan Testnet](https://testnet.bscscan.com/address/0x42067558c48f8c74C819461a9105CD47B90B098F)

**Mainnet:**
- Contract: `0x950E644d66B4a7f7032217B9AFDE11603B4FD447`
- [BSCScan](https://bscscan.com/address/0x950E644d66B4a7f7032217B9AFDE11603B4FD447)

**Note:** The testnet contract is the old version without owner/withdraw functions. New deployments will include these features.

---

**Last Updated:** Based on current contract implementation in `bnb/contracts/stakes/Stakes.sol`

