const {Web3} = require("web3");
const web3 = new Web3(process.env.BSC_TESTNET);
const TokenA = require("../contracts/TokenA.json");
const NFTB = require("../contracts/NFTB.json");
const Staking = require("../contracts/Staking.json");
const {
    adminAddress,
    stakingAddress,
} = require("../contracts/contract-address.json");

const stakingContract = new web3.eth.Contract(Staking.abi, stakingAddress);

const getTransaction = async (hash) => {
    return await web3.eth.getTransaction(hash);
};

module.exports = {
    web3,
    stakingContract,
    getTransaction,
};
