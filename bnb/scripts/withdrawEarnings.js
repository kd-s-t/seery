const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = process.env.MAIN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
  
  if (!CONTRACT_ADDRESS) {
    console.error("Error: MAIN_CONTRACT_ADDRESS or CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }

  console.log("Connecting to contract:", CONTRACT_ADDRESS);
  
  const Main = await hre.ethers.getContractFactory("Main");
  const contract = Main.attach(CONTRACT_ADDRESS);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    console.error("Error: Deployer address does not match contract owner");
    console.error("Deployer:", deployer.address);
    console.error("Owner:", owner);
    process.exit(1);
  }
  
  const balance = await contract.getPlatformEarnings();
  const balanceInBNB = hre.ethers.formatEther(balance);
  
  console.log("\nContract balance (platform earnings):", balanceInBNB, "BNB");
  
  if (balance === 0n) {
    console.log("No earnings to withdraw");
    process.exit(0);
  }
  
  console.log("\nWithdrawing earnings...");
  const tx = await contract.withdrawPlatformEarnings();
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  await tx.wait();
  console.log("✅ Withdrawal successful!");
  
  const newBalance = await contract.getPlatformEarnings();
  console.log("Remaining balance:", hre.ethers.formatEther(newBalance), "BNB");
  
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(deployerBalance), "BNB");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

