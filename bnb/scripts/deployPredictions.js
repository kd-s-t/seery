const hre = require("hardhat");

async function main() {
  console.log("Deploying Main contract...\n");

  // Deploy Main contract (combines Library + Stakes)
  console.log("Deploying Main...");
  const Main = await hre.ethers.getContractFactory("Main");
  const main = await Main.deploy();
  await main.waitForDeployment();
  const mainAddress = await main.getAddress();
  console.log("✅ Main deployed to:", mainAddress);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("\nAdd this to your expressjs/.env file:");
  console.log(`MAIN_CONTRACT_ADDRESS=${mainAddress}`);
  console.log("\nAdd this to your nextjs/.env.local file:");
  console.log(`NEXT_PUBLIC_MAIN_CONTRACT_ADDRESS=${mainAddress}`);
  console.log("\n" + "=".repeat(60));
  console.log("Note: All functions (library + staking) are in one contract address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
