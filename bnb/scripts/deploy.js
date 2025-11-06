const hre = require("hardhat");

async function main() {
  console.log("Deploying PredictionMarket contract...");

  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();

  await predictionMarket.waitForDeployment();

  const address = await predictionMarket.getAddress();
  console.log("PredictionMarket deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("\nAdd this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

