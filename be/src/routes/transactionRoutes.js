const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { isAdmin } = require('../middleware/auth');

// Get all transactions (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'timestamp', order = 'desc', search } = req.query;
        const query = search ? {
            $or: [
                { senderAddress: { $regex: search, $options: 'i' } },
                { receiverAddress: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const options = {
            sort: { [sortBy]: order === 'desc' ? -1 : 1 },
            limit: parseInt(limit),
            skip: (page - 1) * limit
        };

        const transactions = await Transaction.find(query, null, options);
        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
});

// Get transactions for a specific user
router.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { page = 1, limit = 10, sortBy = 'timestamp', order = 'desc' } = req.query;

        const query = {
            $or: [{ senderAddress: address }, { receiverAddress: address }]
        };

        const options = {
            sort: { [sortBy]: order === 'desc' ? -1 : 1 },
            limit: parseInt(limit),
            skip: (page - 1) * limit
        };

        const transactions = await Transaction.find(query, null, options);
        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user transactions', error: error.message });
    }
});

module.exports = router;