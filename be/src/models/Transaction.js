const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    tokenAmount: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
