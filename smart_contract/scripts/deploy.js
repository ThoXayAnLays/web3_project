const path = require("path");

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  //console.log("Account balance:", (await deployer.getBalance()).toString());

  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();
  console.log("Token A address: ", await tokenA.getAddress());

  const NFTB = await ethers.getContractFactory("NFTB");
  const nftB = await NFTB.deploy();
  await nftB.waitForDeployment();
  console.log("NFT B address: ", await nftB.getAddress());

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(await tokenA.getAddress(), await nftB.getAddress());
  await staking.waitForDeployment();
  console.log("Staking contract address: ", await staking.getAddress());

  saveFrontendFiles({
    TokenA: await tokenA.getAddress(),
    NFTB: await nftB.getAddress(),
    Staking: await staking.getAddress()
  });
}

function saveFrontendFiles(addresses) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "..", "fe", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify(addresses, undefined, 2)
  );

  const beContractDir = path.join(__dirname, "..", "..", "be", "src", "contracts");

  if (!fs.existsSync(beContractDir)) {
    fs.mkdirSync(beContractDir);
  }

  fs.writeFileSync(
    path.join(beContractDir, "contract-address.json"),
    JSON.stringify(addresses, undefined, 2)
  );

  const myartifacts = [
    "TokenA",
    "NFTB",
    "Staking"
  ];

  myartifacts.forEach(artifact => {
    const ContractArtifact = artifacts.readArtifactSync(artifact);
    fs.writeFileSync(
      path.join(contractsDir, `${artifact}.json`),
      JSON.stringify(ContractArtifact, null, 2)
    );
  });

  myartifacts.forEach(artifact => {
    const ContractArtifact = artifacts.readArtifactSync(artifact);
    fs.writeFileSync(
      path.join(beContractDir, `${artifact}.json`),
      JSON.stringify(ContractArtifact, null, 2)
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
