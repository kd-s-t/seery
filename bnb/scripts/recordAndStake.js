const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

// Load .env from expressjs directory
function loadEnv() {
  // Script is in bnb/scripts/, so go up two levels to root, then into expressjs
  const envPath = path.join(__dirname, '../../expressjs/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          // Always set, even if already exists (override with .env values)
          process.env[key] = value;
        }
      }
    });
  } else {
    console.warn('Warning: expressjs/.env not found at:', envPath);
  }
}

async function main() {
  loadEnv();
  
  // Get parameters from environment variables
  const cryptoId = process.env.CRYPTO_ID || 'binancecoin';
  const currentPrice = parseFloat(process.env.CURRENT_PRICE || '961.5');
  const predictedPrice = parseFloat(process.env.PREDICTED_PRICE || '1026.88');
  const direction = process.env.DIRECTION || 'up'; // 'up' or 'down'
  const percentChange = parseFloat(process.env.PERCENT_CHANGE || '6.8');
  const stakeAmount = process.env.STAKE_AMOUNT || '0.1'; // BNB
  const stakeUp = process.env.STAKE_UP !== 'false'; // default to true (stake up)
  
  console.log('='.repeat(60));
  console.log('Record Prediction and Stake');
  console.log('='.repeat(60));
  console.log('Parameters:');
  console.log(`  Crypto ID: ${cryptoId}`);
  console.log(`  Current Price: $${currentPrice}`);
  console.log(`  Predicted Price: $${predictedPrice}`);
  console.log(`  Direction: ${direction}`);
  console.log(`  Percent Change: ${percentChange}%`);
  console.log(`  Stake Amount: ${stakeAmount} BNB`);
  console.log(`  Stake Direction: ${stakeUp ? 'UP' : 'DOWN'}`);
  console.log('');
  
  try {
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString());
    
    // Get signer (first account from Hardhat)
    const accounts = await hre.ethers.getSigners();
    if (accounts.length === 0) {
      console.error('No accounts available!');
      process.exit(1);
    }
    
    const signer = accounts[0];
    const signerAddress = await signer.getAddress();
    const balance = await provider.getBalance(signerAddress);
    
    console.log('Using account:', signerAddress);
    console.log('Account balance:', hre.ethers.formatEther(balance), 'BNB');
    console.log('');
    
    if (balance < hre.ethers.parseEther(stakeAmount)) {
      console.error(`Insufficient balance! Need at least ${stakeAmount} BNB for staking.`);
      process.exit(1);
    }
    
    // Get contract address
    const contractAddress = process.env.PREDICTION_STAKING_ADDRESS;
    if (!contractAddress) {
      console.error('PREDICTION_STAKING_ADDRESS not set in environment');
      console.error('Please set it in expressjs/.env or pass as environment variable');
      process.exit(1);
    }
    
    console.log('Contract address:', contractAddress);
    console.log('');
    
    // ABI for contract functions
    const abi = [
      "function recordPrediction(string memory cryptoId, uint256 currentPrice, uint256 predictedPrice, string memory direction, uint256 percentChange) returns (uint256)",
      "function stakeOnPrediction(uint256 predictionId, bool stakeUp) payable",
      "event PredictionRecorded(uint256 indexed predictionId, address indexed predictor, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 timestamp)"
    ];
    
    const contract = new hre.ethers.Contract(contractAddress, abi, signer);
    
    // Step 1: Record Prediction
    console.log('Step 1: Recording prediction...');
    const currentPriceWei = hre.ethers.parseUnits(currentPrice.toString(), 18);
    const predictedPriceWei = hre.ethers.parseUnits(predictedPrice.toString(), 18);
    const percentChangeScaled = Math.round(percentChange * 100); // Convert to basis points
    
    console.log(`  Calling recordPrediction(${cryptoId}, ${currentPriceWei}, ${predictedPriceWei}, ${direction}, ${percentChangeScaled})`);
    
    // Get prediction count before (to help identify new prediction)
    const queryAbi = [
      "function predictionCount() view returns (uint256)",
      "function findActivePrediction(string memory cryptoId) view returns (uint256)"
    ];
    const queryContract = new hre.ethers.Contract(contractAddress, queryAbi, provider);
    
    let predictionCountBefore = 0n;
    try {
      predictionCountBefore = await queryContract.predictionCount();
      console.log('  Current prediction count:', predictionCountBefore.toString());
    } catch (error) {
      console.log('  Could not get prediction count (may not exist in contract)');
    }
    
    // Execute the transaction
    console.log('  Executing transaction...');
    const recordTxResponse = await contract.recordPrediction(
      cryptoId,
      currentPriceWei,
      predictedPriceWei,
      direction,
      percentChangeScaled
    );
    
    console.log('  Transaction hash:', recordTxResponse.hash);
    console.log('  Waiting for confirmation...');
    
    const recordReceipt = await recordTxResponse.wait();
    console.log('  ✅ Transaction confirmed in block:', recordReceipt.blockNumber);
    
    // Get prediction ID from event or by querying
    let predictionId = null;
    
    // Debug: show all logs
    console.log('  Checking transaction logs...');
    console.log('  Total logs:', recordReceipt.logs.length);
    
    // First try to get from event - check all logs
    for (const log of recordReceipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'PredictionRecorded') {
          predictionId = parsed.args.predictionId;
          console.log('  ✅ Prediction ID from event:', predictionId.toString());
          break;
        }
      } catch (e) {
        // Not our event, continue
        continue;
      }
    }
    
    // If still no ID, try querying the contract
    if (!predictionId || predictionId === 0n) {
      console.log('  Event not found in logs, querying contract...');
      
      // Try predictionCount method
      try {
        const predictionCountAfter = await queryContract.predictionCount();
        console.log('  Prediction count after:', predictionCountAfter.toString());
        
        if (predictionCountAfter > predictionCountBefore) {
          // New prediction was created
          predictionId = predictionCountAfter;
          console.log('  ✅ Prediction ID from count:', predictionId.toString());
        } else {
          // Count unchanged, might be existing prediction - check recent predictions
          console.log('  Prediction count unchanged, checking recent predictions...');
          const checkAbi = ["function getPrediction(uint256 predictionId) view returns (address, string memory, uint256, uint256, uint256, uint256, bool, uint256, string memory, uint256)"];
          const checkContract = new hre.ethers.Contract(contractAddress, checkAbi, provider);
          
          // Check last 10 predictions
          const maxCheck = Number(predictionCountAfter) || 10;
          const startCheck = Math.max(1, maxCheck - 9);
          
          for (let i = maxCheck; i >= startCheck; i--) {
            try {
              const pred = await checkContract.getPrediction(i);
              // Check if this prediction matches our crypto and was created recently (within last minute)
              const predTimestamp = Number(pred[5]); // timestamp is at index 5
              const currentTime = Math.floor(Date.now() / 1000);
              
              if (pred[1] === cryptoId && (currentTime - predTimestamp) < 60) {
                predictionId = BigInt(i);
                console.log('  ✅ Found matching prediction ID:', predictionId.toString());
                break;
              }
            } catch {
              continue;
            }
          }
        }
      } catch (error) {
        console.log('  Error querying prediction count:', error.message);
      }
    }
    
    // If we still don't have a prediction ID, try to find it by attempting to query predictions
    if (!predictionId || predictionId === 0n) {
      console.log('  Trying to find prediction by querying recent IDs...');
      const checkAbi = [
        "function getPrediction(uint256 predictionId) view returns (address, string memory, uint256, uint256, uint256, uint256, bool, uint256, string memory, uint256)"
      ];
      const checkContract = new hre.ethers.Contract(contractAddress, checkAbi, provider);
      
      // Try IDs from 1 to 50 (reasonable range for testing)
      // Check predictions created in the last 2 minutes
      const currentTime = Math.floor(Date.now() / 1000);
      const timeWindow = 120; // 2 minutes
      
      for (let i = 1; i <= 50; i++) {
        try {
          const pred = await checkContract.getPrediction(i);
          const predCryptoId = pred[1];
          const predTimestamp = Number(pred[5]);
          const timeDiff = currentTime - predTimestamp;
          
          // Check if this matches our crypto and was created recently
          if (predCryptoId === cryptoId && timeDiff >= 0 && timeDiff < timeWindow) {
            predictionId = BigInt(i);
            console.log(`  ✅ Found prediction ID ${i} matching our transaction (created ${timeDiff}s ago)`);
            break;
          }
        } catch {
          // Prediction doesn't exist, continue
          continue;
        }
      }
      
      // If still not found, try the most recent prediction that matches the crypto
      if (!predictionId || predictionId === 0n) {
        console.log('  Trying to find most recent prediction for this crypto...');
        for (let i = 50; i >= 1; i--) {
          try {
            const pred = await checkContract.getPrediction(i);
            if (pred[1] === cryptoId) {
              predictionId = BigInt(i);
              console.log(`  ✅ Using most recent prediction ID ${i} for ${cryptoId}`);
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }
    
    // If we still don't have a prediction ID, try brute force staking
    if (!predictionId || predictionId === 0n) {
      console.log('  ⚠️  Could not find prediction ID automatically');
      console.log('  Attempting to stake on recent prediction IDs (1-10)...');
      const stakeAmountWei = hre.ethers.parseEther(stakeAmount);
      
      // Try staking on IDs 1-10 to find which one works
      for (let testId = 1; testId <= 10; testId++) {
        try {
          // Try a static call first to see if staking would work
          await contract.stakeOnPrediction.staticCall(BigInt(testId), stakeUp, {
            value: stakeAmountWei
          });
          // If static call succeeds, this ID is valid
          predictionId = BigInt(testId);
          console.log(`  ✅ Found valid prediction ID ${testId} by testing`);
          break;
        } catch {
          // This ID doesn't work, try next
          continue;
        }
      }
    }
    
    if (!predictionId || predictionId === 0n) {
      console.error('  ❌ Could not determine prediction ID');
      console.error('  Transaction was successful but could not extract prediction ID');
      console.error('  Transaction hash:', recordTxResponse.hash);
      console.error('  Note: The contract may have returned an existing prediction without emitting an event');
      console.error('  You can manually query the contract or try staking on a specific prediction ID');
      process.exit(1);
    }
    
    console.log('');
    
    // Step 2: Stake on Prediction
    console.log('Step 2: Staking on prediction...');
    const stakeAmountWei = hre.ethers.parseEther(stakeAmount);
    
    console.log(`  Calling stakeOnPrediction(${predictionId}, ${stakeUp}) with ${stakeAmount} BNB`);
    
    try {
      const stakeTx = await contract.stakeOnPrediction(predictionId, stakeUp, {
        value: stakeAmountWei
      });
      
      console.log('  Transaction hash:', stakeTx.hash);
      console.log('  Waiting for confirmation...');
      
      const stakeReceipt = await stakeTx.wait();
      console.log('  ✅ Transaction confirmed in block:', stakeReceipt.blockNumber);
      
      console.log('');
      console.log('='.repeat(60));
      console.log('✅ SUCCESS!');
      console.log('='.repeat(60));
      console.log(`Prediction ID: ${predictionId.toString()}`);
      console.log(`Staked: ${stakeAmount} BNB (${stakeUp ? 'UP' : 'DOWN'})`);
      console.log(`Record TX: ${recordTxResponse.hash}`);
      console.log(`Stake TX: ${stakeTx.hash}`);
      console.log('='.repeat(60));
    } catch (stakeError) {
      console.error('  ❌ Error staking:', stakeError.message);
      if (stakeError.reason) {
        console.error('  Revert reason:', stakeError.reason);
      }
      console.error('  Prediction was recorded successfully, but staking failed');
      console.error('  You can try staking manually using prediction ID:', predictionId.toString());
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nHardhat node is not running!');
      console.error('Please start it with: npx hardhat node');
    } else if (error.reason) {
      console.error('Revert reason:', error.reason);
    }
    if (error.transaction) {
      console.error('Transaction:', error.transaction);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

