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
    lineaSepolia: {
      url: `https://linea-sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    bscTest: {
      url: `https://bsc-testnet-rpc.publicnode.com`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 97,
    }
  }
};
