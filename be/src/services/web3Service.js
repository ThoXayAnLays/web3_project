const Web3 = require('web3');
const contract = require('@truffle/contract');
const stakingArtifact = require('../contracts/Staking.json');
const contractAddresses = require('../contracts/contract-address.json');

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.BSC_TESTNET_WS));

const Staking = contract(stakingArtifact);
Staking.setProvider(web3.currentProvider);

const stakingInstance = new web3.eth.Contract(Staking.abi, contractAddresses.Staking);

async function getEvents(fromBlock) {
    const events = await stakingInstance.getPastEvents('allEvents', {
        fromBlock: fromBlock,
        toBlock: 'latest'
    });
    return events;
}

module.exports = {
    getEvents,
    stakingInstance,
    web3
};