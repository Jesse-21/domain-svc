const main = async () => {
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy("space");
  await domainContract.deployed();
  const domainame = "build"

  console.log("Contract deployed to:", domainContract.address);

  // CHANGE THIS DOMAIN TO SOMETHING ELSE! I don't want to see OpenSea full of bananas lol
	let txn = await domainContract.register(domainame,  {value: hre.ethers.utils.parseEther('0.001')});
	await txn.wait();
  console.log("Minted domain " + domainame + ".space");

  txn = await domainContract.setRecord(domainame, "address x?");
  await txn.wait();
  console.log("Set record for " + domainame + ".space");

  const address = await domainContract.getAddress(domainame);
  console.log("Owner of domain " + domainame, address);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();