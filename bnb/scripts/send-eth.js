const hre = require("hardhat");

async function main() {
  // Get the recipient address from command line or use default
  const recipientAddress = process.argv[2] || '0xa347f85cc98e691c882a38dad051c249a2ad8a77';
  
  if (!recipientAddress || !hre.ethers.isAddress(recipientAddress)) {
    console.log("Usage: npx hardhat run scripts/send-eth.js --network localhost");
    console.log("Or set recipient address in the script");
    console.log("\nAvailable accounts with balances:");
    const accounts = await hre.ethers.getSigners();
    for (let i = 0; i < Math.min(10, accounts.length); i++) {
      const balance = await hre.ethers.provider.getBalance(accounts[i].address);
      const balanceInEth = hre.ethers.formatEther(balance);
      console.log(`Account ${i}: ${accounts[i].address} - ${balanceInEth} ETH`);
    }
    return;
  }

  const accounts = await hre.ethers.getSigners();
  const sender = accounts[0]; // Use first account (has most ETH)
  
  const amount = hre.ethers.parseEther("100"); // Send 100 ETH
  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amount,
  });
  
  console.log(`Sending 100 ETH to ${recipientAddress}...`);
  console.log(`Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("Transaction confirmed!");
  
  const recipientBalance = await hre.ethers.provider.getBalance(recipientAddress);
  console.log(`New balance: ${hre.ethers.formatEther(recipientBalance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

