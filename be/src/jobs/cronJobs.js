const schedule = require("node-schedule");
const { Web3 } = require("web3");
const {
    getContractAddresses,
    getContractABIs,
} = require("../utils/contractUtils");
const Transaction = require("../models/Transaction");
const LastCrawledBlock = require("../models/LastCrawledBlock");

const web3 = new Web3(process.env.INFURA_URL);

let stakingContract;
const DEPLOYMENT_BLOCK = 3614727;
const MAX_BLOCKS_PER_QUERY = 5000;

// Update event names based on your contract
const eventNames = [
    "Deposited",
    "NFTDeposited",
    "Withdrawn",
    "RewardClaimed",
    "APRUpdated",
];

function logSeparator(message) {
    console.log("\n------------------------------");
    console.log(message);
    console.log("------------------------------\n");
}

async function initializeContracts() {
    const addresses = await getContractAddresses();
    const abis = await getContractABIs();

    stakingContract = new web3.eth.Contract(abis.Staking, addresses.Staking);

    logSeparator("Contract Initialization");
    console.log("Staking contract initialized:", addresses.Staking);
}

async function getLastCrawledBlock() {
    let lastCrawledBlock = await LastCrawledBlock.findOne({
        contractName: "Staking",
    });
    if (!lastCrawledBlock) {
        lastCrawledBlock = new LastCrawledBlock({
            contractName: "Staking",
            blockNumber: (DEPLOYMENT_BLOCK - 1).toString(), // Start from deployment block
        });
        await lastCrawledBlock.save();
    }
    logSeparator("Last Crawled Block");
    console.log(
        "Last crawled block for Staking:",
        lastCrawledBlock.blockNumber
    );
    return BigInt(lastCrawledBlock.blockNumber);
}

async function updateLastCrawledBlock(blockNumber) {
    await LastCrawledBlock.findOneAndUpdate(
        { contractName: "Staking" },
        { blockNumber: blockNumber.toString() },
        { upsert: true }
    );
    logSeparator("Updated Last Crawled Block");
    console.log(
        "Updated last crawled block for Staking to:",
        blockNumber.toString()
    );
}

async function processEvents(fromBlock, toBlock) {
    logSeparator(`Processing Events from ${fromBlock} to ${toBlock}`);

    try {
        let allEvents = [];
        for (const eventName of eventNames) {
            const events = await stakingContract.getPastEvents(eventName, {
                fromBlock: fromBlock.toString(),
                toBlock: toBlock.toString(),
            });
            allEvents = allEvents.concat(events);
            console.log(`Found ${events.length} ${eventName} events`);
        }

        console.log(`Total events found: ${allEvents.length}`);

        for (const event of allEvents) {
            console.log(
                `Processing event: ${event.event} in transaction ${event.transactionHash}`
            );
            console.log("Event details:", JSON.stringify(event, null, 2));

            const transaction = new Transaction({
                fromAddress:
                    event.returnValues.user ||
                    event.returnValues.owner ||
                    event.returnValues.from,
                toAddress: event.address,
                eventType: event.event,
                amount:
                    event.returnValues.amount ||
                    event.returnValues.reward ||
                    event.returnValues.newBaseAPR ||
                    "0",
                timestamp: new Date(
                    (await web3.eth.getBlock(event.blockNumber)).timestamp *
                        1000
                ),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
            });

            await transaction.save();
            console.log(`Saved transaction for event ${event.event}`);
        }

        // If no events were found, log all transactions in this block range
        if (allEvents.length === 0) {
            logSeparator("No events found, checking all transactions");
            for (let i = Number(fromBlock); i <= Number(toBlock); i++) {
                const block = await web3.eth.getBlock(i, true);
                for (const tx of block.transactions) {
                    if (
                        tx.to &&
                        tx.to.toLowerCase() ===
                            stakingContract.options.address.toLowerCase()
                    ) {
                        console.log(
                            `Transaction found in block ${i}:`,
                            tx.hash
                        );
                        console.log(
                            "Transaction details:",
                            JSON.stringify(tx, null, 2)
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error processing events:`, error);
        throw error;
    }
}

async function crawlEvents() {
    try {
        const currentBlock = BigInt(await web3.eth.getBlockNumber());
        let lastCrawledBlock = await getLastCrawledBlock();

        while (lastCrawledBlock < currentBlock) {
            let toBlock = lastCrawledBlock + BigInt(MAX_BLOCKS_PER_QUERY);
            if (toBlock > currentBlock) {
                toBlock = currentBlock;
            }

            logSeparator(`Crawling Events`);
            console.log(
                `Crawling from block ${lastCrawledBlock} to ${toBlock}`
            );

            await processEvents(lastCrawledBlock, toBlock);
            await updateLastCrawledBlock(toBlock);

            lastCrawledBlock = toBlock;
        }

        logSeparator("Crawling Completed");
        console.log("All blocks processed up to", currentBlock.toString());
    } catch (error) {
        console.error("Error crawling events:", error);
    }
}

function startCronJobs() {
    initializeContracts().then(() => {
        // Run every 5 minutes
        const job = schedule.scheduleJob("*/5 * * * *", crawlEvents);
        logSeparator("Cron Job Scheduled");
        console.log("Cron job scheduled to run every 5 minutes");

        // Run immediately after startup
        crawlEvents();
    });
}

module.exports = {
    startCronJobs,
    crawlEvents,
};
