const hre = require("hardhat");

async function main() {
  const Main = await hre.ethers.getContractFactory("Main");
  const main = await Main.attach("0x9A676e781A523b5d0C0e43731313A708CB607508");
  
  console.log("Calling getStakes()...");
  try {
    const result = await main.getStakes();
    console.log("Success!");
    console.log("Total stakes:", result.totalStakes.toString());
    console.log("Total amount:", result.totalAmountStaked.toString());
    console.log("Stakes array length:", result.stakes.length);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
