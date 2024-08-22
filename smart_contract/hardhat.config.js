require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          evmVersion: "paris",
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks:{
    bscTestnet: {
      url: "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000,
      timeout: 60000 // 60 seconds
    },
    lineaSepolia: {
      url: `https://linea-sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
  }
};
