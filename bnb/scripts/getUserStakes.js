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
  
  // Get address from environment variable or use default test address
  const userAddress = process.env.USER_ADDRESS || '0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae';
  
  if (!userAddress) {
    console.error('Usage: USER_ADDRESS=0x... npx hardhat run scripts/getUserStakes.js --network localhost');
    console.error('Example: USER_ADDRESS=0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae npx hardhat run scripts/getUserStakes.js --network localhost');
    console.error('\nOr set USER_ADDRESS in your .env file');
    process.exit(1);
  }
  
  if (!hre.ethers.isAddress(userAddress)) {
    console.error('Invalid address format:', userAddress);
    process.exit(1);
  }
  
  console.log('Connecting to Hardhat node...');
  
  try {
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString());
    
    // Get contract address from environment
    const contractAddress = process.env.PREDICTION_STAKING_ADDRESS;
    if (!contractAddress) {
      console.error('PREDICTION_STAKING_ADDRESS not set in environment');
      console.error('Please set it in expressjs/.env or pass as environment variable');
      process.exit(1);
    }
    
    console.log('Contract address:', contractAddress);
    console.log('Querying stakes for:', userAddress);
    console.log('');
    
    // ABI for both functions
    const abi = [
      "function getUserStakedPredictions(address user) view returns (uint256[])",
      "function getStakesByUser(address user) view returns (tuple(uint256 predictionId, string cryptoId, uint256 currentPrice, uint256 predictedPrice, uint256 actualPrice, uint256 timestamp, bool verified, uint256 accuracy, string direction, uint256 percentChange, uint256 expiresAt, uint256 totalStakedUp, uint256 totalStakedDown, uint256 userStakeUp, uint256 userStakeDown)[])"
    ];
    
    const contract = new hre.ethers.Contract(contractAddress, abi, provider);
    
    // Try getStakesByUser first (more detailed)
    let stakesData = null;
    try {
      stakesData = await contract.getStakesByUser(userAddress);
    } catch (error) {
      if (error.message?.includes('could not decode result data') || error.message?.includes('value="0x"')) {
        console.log('✅ User has no stakes (empty result)');
        console.log('');
        console.log('No stakes found for this address.');
        console.log('');
        console.log('✅ Query complete!');
        return;
      }
      console.log('⚠️  getStakesByUser not available, trying getUserStakedPredictions...');
      stakesData = null;
    }
    
    if (stakesData && stakesData.length > 0) {
      console.log('✅ User has', stakesData.length, 'stake(s)');
      console.log('');
      console.log('Detailed Stake Information:');
      console.log('='.repeat(80));
      
      stakesData.forEach((stake, index) => {
        console.log(`\nStake ${index + 1}:`);
        console.log(`  Prediction ID: ${stake.predictionId.toString()}`);
        console.log(`  Crypto ID: ${stake.cryptoId}`);
        console.log(`  Direction: ${stake.direction}`);
        console.log(`  Current Price: $${hre.ethers.formatUnits(stake.currentPrice, 18)}`);
        console.log(`  Predicted Price: $${hre.ethers.formatUnits(stake.predictedPrice, 18)}`);
        console.log(`  Percent Change: ${Number(stake.percentChange) / 100}%`);
        console.log(`  Your Stake UP: ${hre.ethers.formatEther(stake.userStakeUp)} BNB`);
        console.log(`  Your Stake DOWN: ${hre.ethers.formatEther(stake.userStakeDown)} BNB`);
        console.log(`  Total Staked UP: ${hre.ethers.formatEther(stake.totalStakedUp)} BNB`);
        console.log(`  Total Staked DOWN: ${hre.ethers.formatEther(stake.totalStakedDown)} BNB`);
        console.log(`  Verified: ${stake.verified ? 'Yes' : 'No'}`);
        if (stake.verified) {
          console.log(`  Actual Price: $${hre.ethers.formatUnits(stake.actualPrice, 18)}`);
          console.log(`  Accuracy: ${stake.accuracy.toString()}%`);
        }
        console.log(`  Created: ${new Date(Number(stake.timestamp) * 1000).toISOString()}`);
        console.log(`  Expires: ${new Date(Number(stake.expiresAt) * 1000).toISOString()}`);
      });
      
      console.log('\n' + '='.repeat(80));
    } else {
      // Fallback to getUserStakedPredictions
      let predictionIds;
      try {
        predictionIds = await contract.getUserStakedPredictions(userAddress);
      } catch (error) {
        if (error.message?.includes('could not decode result data') || error.message?.includes('value="0x"')) {
          console.log('✅ User has no stakes (empty result)');
          console.log('');
          console.log('No prediction IDs found for this address.');
          console.log('');
          console.log('✅ Query complete!');
          return;
        }
        throw error;
      }
      
      console.log('✅ User has staked on', predictionIds.length, 'prediction(s)');
      console.log('');
      
      if (predictionIds.length === 0) {
        console.log('No stakes found for this address.');
      } else {
        console.log('Prediction IDs:');
        predictionIds.forEach((id, index) => {
          console.log(`  ${index + 1}. Prediction ID: ${id.toString()}`);
        });
      }
    }
    
    console.log('');
    console.log('✅ Query complete!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nHardhat node is not running!');
      console.error('Please start it with: npx hardhat node');
    } else if (error.message?.includes('does not have the function')) {
      console.error('\nContract may not have getUserStakedPredictions function');
      console.error('Make sure the contract is deployed and address is correct');
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

