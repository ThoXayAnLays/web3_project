const mongoose = require("mongoose");

const lastCrawledBlockSchema = new mongoose.Schema({
    contractName: {
        type: String,
        required: true,
        unique: true,
    },
    blockNumber: {
        type: String,
        required: true,
    },
});

const LastCrawledBlock = mongoose.model(
    "LastCrawledBlock",
    lastCrawledBlockSchema
);

module.exports = LastCrawledBlock;
