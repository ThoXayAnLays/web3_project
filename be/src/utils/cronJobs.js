const schedule = require('node-schedule');
const {Web3} = require('web3');
const Transaction = require('../models/Transaction');
const contractAddresses = require('../contracts/contract-address.json');
const StakingABI = require('../contracts/Staking.json').abi;
const dotenv = require('dotenv');
dotenv.config();

const web3 = new Web3(process.env.BSC_TESTNET);
const stakingContract = new web3.eth.Contract(StakingABI, contractAddresses.Staking);

const BLOCKS_PER_BATCH = 1000;

let lastProcessedBlock = 0;

const crawlTransactions = async () => {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        const fromBlock = lastProcessedBlock + 1;
        const toBlock = Math.min(fromBlock + BLOCKS_PER_BATCH - 1, latestBlock);

        console.log(`Crawling blocks ${fromBlock} to ${toBlock}`);

        const events = await stakingContract.getPastEvents('allEvents', {
            fromBlock,
            toBlock
        });

        for (const event of events) {
            const tx = await web3.eth.getTransaction(event.transactionHash);
            await Transaction.findOneAndUpdate(
                { transactionHash: event.transactionHash },
                {
                    senderAddress: tx.from,
                    receiverAddress: tx.to,
                    amount: web3.utils.fromWei(tx.value, 'ether'),
                    timestamp: new Date((await web3.eth.getBlock(tx.blockNumber)).timestamp * 1000),
                    transactionHash: event.transactionHash
                },
                { upsert: true, new: true }
            );
        }

        lastProcessedBlock = toBlock;
        console.log(`Processed up to block ${toBlock}`);
    } catch (error) {
        console.error('Error processing crawl job:', error);
    }
};

const setupCronJobs = () => {
    // Run every 5 minutes
    schedule.scheduleJob('*/5 * * * *', crawlTransactions);
};

module.exports = { setupCronJobs };