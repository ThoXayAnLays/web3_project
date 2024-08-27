const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const transactionSchema = new mongoose.Schema({
    fromAddress: {
        type: String,
        required: true,
        index: true,
    },
    toAddress: {
        type: String,
        required: true,
        index: true,
    },
    eventType: {
        type: String,
        required: true,
        enum: [
            "Deposited",
            "NFTDeposited",
            "Withdrawn",
            "RewardClaimed",
            "APRUpdated",
            "NFTMinted",
            "NFTWithdrawn",
        ],
        index: true,
    },
    amount: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
        index: true,
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true,
    },
    blockNumber: {
        type: String,
        required: true,
    },
    gasUsed: {
        type: String,
        required: true,
    },
});

transactionSchema.plugin(mongoosePaginate);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
