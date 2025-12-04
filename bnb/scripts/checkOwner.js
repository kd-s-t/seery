const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = process.env.MAIN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "0xbB0383E1CE84C278a149AAb84F3aC7DE6687d2d6";
  
  console.log("Checking contract owner...\n");
  console.log("Contract address:", CONTRACT_ADDRESS);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Your wallet address:", deployer.address);
  
  try {
    const Main = await hre.ethers.getContractFactory("Main");
    const contract = Main.attach(CONTRACT_ADDRESS);
    
    // Try to get owner (new contracts have this)
    try {
      const owner = await contract.owner();
      console.log("\nContract owner:", owner);
      
      if (deployer.address.toLowerCase() === owner.toLowerCase()) {
        console.log("✅ You are the contract owner!");
      } else {
        console.log("❌ You are NOT the contract owner");
        console.log("   Owner:", owner);
        console.log("   Your address:", deployer.address);
      }
    } catch (error) {
      console.log("\n⚠️  Contract doesn't have owner() function (old contract version)");
      console.log("   This means the contract was deployed before the owner feature was added");
    }
    
    // Check contract balance
    try {
      const balance = await contract.getPlatformEarnings();
      const balanceInBNB = hre.ethers.formatEther(balance);
      console.log("\nContract balance (platform earnings):", balanceInBNB, "BNB");
    } catch (error) {
      // Old contract doesn't have this function
      const balance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
      const balanceInBNB = hre.ethers.formatEther(balance);
      console.log("\nContract balance:", balanceInBNB, "BNB");
      console.log("   (Cannot withdraw - old contract version)");
    }
    
    // Check contract creator on BSCScan
    console.log("\n" + "=".repeat(60));
    console.log("To verify contract creator:");
    console.log("=".repeat(60));
    const network = hre.network.name;
    if (network === "bnbTestnet") {
      console.log(`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`);
    } else if (network === "bnbMainnet") {
      console.log(`https://bscscan.com/address/${CONTRACT_ADDRESS}`);
    }
    console.log("   Look for 'Contract Creator' field");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("contract")) {
      console.log("\n💡 Make sure MAIN_CONTRACT_ADDRESS is set correctly in .env");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

