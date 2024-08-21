// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    senderAddress: { type: String, required: true },
    receiverAddress: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    transactionHash: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);