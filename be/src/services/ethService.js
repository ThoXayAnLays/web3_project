const Web3 = require('web3');
const Transaction = require('../models/Transaction');

const web3 = new Web3(process.env.ETHEREUM_NODE_URL);

class EthService {
    static async crawlTransactions(fromBlock, toBlock) {
        const transactions = await web3.eth.getPastLogs({
            fromBlock,
            toBlock,
            address: process.env.CONTRACT_ADDRESS,
        });

        for (const tx of transactions) {
            const transaction = await web3.eth.getTransaction(tx.transactionHash);
            const block = await web3.eth.getBlock(tx.blockNumber);

            await Transaction.create({
                from: transaction.from,
                to: transaction.to,
                value: transaction.value,
                hash: transaction.hash,
                blockNumber: tx.blockNumber,
                timestamp: block.timestamp,
            });
        }
    }
}

module.exports = EthService;