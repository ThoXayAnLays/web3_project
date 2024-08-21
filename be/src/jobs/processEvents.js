const kue = require("kue");
const queue = kue.createQueue();
const { stakingContract } = require("../services/web3Service");
const Transaction = require("../models/Transaction");

queue.process("processTransaction", async (job, done) => {
    const { transactionHash } = job.data;
    try {
        const transaction = await getTransaction(transactionHash);
        const newTransaction = new Transaction({
            sender: transaction.from,
            receiver: transaction.to,
            tokenAmount: transaction.value,
            transactionHash: transactionHash,
        });
        await newTransaction.save();
        done();
    } catch (error) {
        done(error);
    }
});

stakingContract.events
    .allEvents()
    .on("data", (event) => {
        queue
            .create("processTransaction", {
                transactionHash: event.transactionHash,
            })
            .save();
    })
    .on("error", console.error);
