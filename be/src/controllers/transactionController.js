const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
    const { page, limit, sortBy, sortOrder, search } = req.query;
    const transactions = await Transaction.getAll(page, limit, sortBy, sortOrder, search);
    res.json(transactions);
};

exports.getUserTransactions = async (req, res) => {
    const { userAddress } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;
    const transactions = await Transaction.getByUser(userAddress, page, limit, sortBy, sortOrder);
    res.json(transactions);
};