const cron = require('node-cron');
const kue = require('kue');
const web3Service = require('./web3Service');
const Transaction = require('../models/transaction');

const queue = kue.createQueue();

function initializeJobs() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        const job = queue.create('crawlEvents', {}).save((err) => {
            if (!err) console.log(`Job ${job.id} created`);
        });
    });

    queue.process('crawlEvents', async (job, done) => {
        try {
            const latestBlock = await web3Service.web3.eth.getBlockNumber();
            const events = await web3Service.getEvents(latestBlock - 1000); // Get events from last 1000 blocks

            for (const event of events) {
                await Transaction.create({
                    user: event.returnValues.user,
                    event: event.event,
                    amount: event.returnValues.amount,
                    timestamp: (await web3Service.web3.eth.getBlock(event.blockNumber)).timestamp
                });
            }

            done();
        } catch (error) {
            console.error('Error processing job:', error);
            done(error);
        }
    });
}

module.exports = {
    initializeJobs
};