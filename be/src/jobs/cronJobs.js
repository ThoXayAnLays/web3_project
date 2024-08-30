const schedule = require("node-schedule");
const { Web3 } = require("web3");
const {
    getContractAddresses,
    getContractABIs,
} = require("../utils/contractUtils");
const Transaction = require("../models/Transaction");
const LastCrawledBlock = require("../models/LastCrawledBlock");
const config = require("../config");
const dotenv = require("dotenv");
dotenv.config();

const web3 = new Web3(process.env.INFURA_URL);

let stakingContract;
const DEPLOYMENT_BLOCK = BigInt(config.DEPLOYMENT_BLOCK);
const MAX_BLOCKS_PER_QUERY = BigInt(config.MAX_BLOCKS_PER_QUERY);
const CRON_SCHEDULE = config.CRON_SCHEDULE;

const eventNames = [
    "Deposited",
    "NFTDeposited",
    "Withdrawn",
    "RewardClaimed",
    "APRUpdated",
    "NFTMinted",
    "NFTWithdrawn",
];

async function initializeContracts() {
    const addresses = await getContractAddresses();
    const abis = await getContractABIs();
    stakingContract = new web3.eth.Contract(abis.Staking, addresses.Staking);
    console.log("Staking contract initialized:", addresses.Staking);
}

async function getLastCrawledBlock() {
    let lastCrawledBlock = await LastCrawledBlock.findOne({
        contractName: "Staking",
    });
    if (!lastCrawledBlock) {
        lastCrawledBlock = new LastCrawledBlock({
            contractName: "Staking",
            blockNumber: (DEPLOYMENT_BLOCK - BigInt(1)).toString(),
        });
        await lastCrawledBlock.save();
    }
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
    console.log(
        "Updated last crawled block for Staking to:",
        blockNumber.toString()
    );
}

async function processEvents(fromBlock, toBlock) {
    console.log(`Processing events from block ${fromBlock} to ${toBlock}`);

    try {
        const eventPromises = eventNames.map((eventName) =>
            stakingContract.getPastEvents(eventName, {
                fromBlock: fromBlock.toString(),
                toBlock: toBlock.toString(),
            })
        );

        const allEventsArrays = await Promise.all(eventPromises);
        const allEvents = allEventsArrays.flat();

        console.log(`Total events found: ${allEvents.length}`);

        const transactionPromises = allEvents.map(async (event) => {
            try {
                const block = await web3.eth.getBlock(event.blockNumber);
                const transactionReceipt = await web3.eth.getTransactionReceipt(
                    event.transactionHash
                );

                const transactionData = {
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
                    timestamp: new Date(Number(block.timestamp) * 1000),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber.toString(),
                    gasUsed: transactionReceipt.gasUsed.toString(),
                    logIndex: event.logIndex.toString(),
                };

                await Transaction.findOneAndUpdate(
                    { transactionHash: transactionData.transactionHash, logIndex: transactionData.logIndex },
                    transactionData,
                    { upsert: true, new: true }
                );

                console.log(
                    `Processed and saved event ${event.event} in block ${event.blockNumber}. Gas used: ${transactionData.gasUsed}`
                );
            } catch (error) {
                console.error(
                    `Error processing event ${event.event} in block ${event.blockNumber}:`,
                    error
                );
            }
        });

        await Promise.all(transactionPromises);
    } catch (error) {
        console.error(`Error processing events:`, error);
        throw error;
    }
}

async function findMissedBlocks(lastCrawledBlock, currentBlock) {
    const missedRanges = [];
    let startMissed = lastCrawledBlock + BigInt(1);

    while (startMissed < currentBlock) {
        const endMissed = BigInt(
            Math.min(
                Number(startMissed) + Number(MAX_BLOCKS_PER_QUERY),
                Number(currentBlock)
            )
        );
        missedRanges.push([startMissed, endMissed]);
        startMissed = endMissed + BigInt(1);
    }

    return missedRanges;
}

async function crawlEvents() {
    try {
        const currentBlock = BigInt(await web3.eth.getBlockNumber());
        let lastCrawledBlock = await getLastCrawledBlock();

        // Check for missed blocks
        const missedRanges = await findMissedBlocks(
            lastCrawledBlock,
            currentBlock
        );

        if (missedRanges.length > 0) {
            console.log("Detected missed blocks. Re-crawling...");
            for (const [start, end] of missedRanges) {
                await processEvents(start, end);
                await updateLastCrawledBlock(end);
            }
        }

        // Proceed with normal crawl
        let toBlock = lastCrawledBlock + MAX_BLOCKS_PER_QUERY;
        if (toBlock > currentBlock) {
            toBlock = currentBlock;
        }

        if (toBlock > lastCrawledBlock) {
            console.log(
                `Crawling from block ${lastCrawledBlock} to ${toBlock}`
            );
            await processEvents(lastCrawledBlock, toBlock);
            await updateLastCrawledBlock(toBlock);
        }

        console.log("All blocks processed up to", currentBlock.toString());
    } catch (error) {
        console.error("Error crawling events:", error);
    }
}

function startCronJobs() {
    initializeContracts().then(() => {
        const job = schedule.scheduleJob(CRON_SCHEDULE, crawlEvents);
        console.log(
            `Cron job scheduled to run according to schedule: ${CRON_SCHEDULE}`
        );

        // Run immediately after startup
        crawlEvents();
    });
}

module.exports = {
    startCronJobs,
    crawlEvents,
};
