const schedule = require("node-schedule");
const { Web3 } = require("web3");
const {
    getContractAddresses,
    getContractABIs,
} = require("../utils/contractUtils");
const Transaction = require("../models/Transaction");

const web3 = new Web3(process.env.INFURA_URL);

const contracts = {};
let latestBlock = 0n;

async function initializeContracts() {
    const addresses = await getContractAddresses();
    const abis = await getContractABIs();

    contracts.tokenA = new web3.eth.Contract(abis.TokenA, addresses.TokenA);
    contracts.nftB = new web3.eth.Contract(abis.NFTB, addresses.NFTB);
    contracts.staking = new web3.eth.Contract(abis.Staking, addresses.Staking);

    latestBlock = BigInt(await web3.eth.getBlockNumber());
}

async function processEvents(fromBlock, toBlock) {
    const eventTypes = [
        { name: "Deposited", contract: "staking" },
        { name: "NFTDeposited", contract: "staking" },
        { name: "Withdrawn", contract: "staking" },
        { name: "RewardClaimed", contract: "staking" },
        { name: "APRUpdated", contract: "staking" },
    ];

    for (const eventType of eventTypes) {
        const events = await contracts[eventType.contract].getPastEvents(
            eventType.name,
            {
                fromBlock: fromBlock.toString(),
                toBlock: toBlock.toString(),
            }
        );

        for (const event of events) {
            const block = await web3.eth.getBlock(event.blockNumber);
            const transaction = new Transaction({
                fromAddress:
                    event.returnValues.user || event.returnValues.owner,
                toAddress: contracts[eventType.contract].options.address,
                eventType: eventType.name,
                amount:
                    event.returnValues.amount ||
                    event.returnValues.reward ||
                    event.returnValues.newBaseAPR ||
                    "0",
                timestamp: new Date(Number(block.timestamp) * 1000),
                transactionHash: event.transactionHash,
            });

            await transaction.save();
        }
    }
}

async function crawlEvents() {
    try {
        const currentBlock = BigInt(await web3.eth.getBlockNumber());
        console.log(
            `Crawling events from block ${latestBlock + 1n} to ${currentBlock}`
        );
        await processEvents(latestBlock + 1n, currentBlock);
        latestBlock = currentBlock;
    } catch (error) {
        console.error("Error crawling events:", error);
        console.error("Error details:", error.stack);
        throw error;
    }
}

function startCronJobs() {
    initializeContracts().then(() => {
        // Run every 5 minutes
        schedule.scheduleJob("*/5 * * * *", crawlEvents);
    });
}

module.exports = {
    startCronJobs,
    crawlEvents,
};
