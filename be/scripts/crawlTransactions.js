const EthService = require('../src/services/ethService');
const JobService = require('../src/services/jobService');

async function crawlTransactions() {
    const latestBlock = await web3.eth.getBlockNumber();
    const fromBlock = latestBlock - 1000; // Adjust as needed

    JobService.createJob('crawlTransactions', { fromBlock, toBlock: latestBlock });
}

// Run every 5 minutes
setInterval(crawlTransactions, 5 * 60 * 1000);