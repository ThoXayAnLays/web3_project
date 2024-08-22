const Transaction = require("../models/Transaction");

exports.getUserTransactions = async (req, res) => {
    try {
        const { address } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = "timestamp",
            sortOrder = "desc",
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        };

        const transactions = await Transaction.paginate(
            { $or: [{ fromAddress: address }, { toAddress: address }] },
            options
        );

        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user transactions",
            error: error.message,
        });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "timestamp",
            sortOrder = "desc",
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        };

        const transactions = await Transaction.paginate({}, options);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching all transactions",
            error: error.message,
        });
    }
};

exports.searchTransactions = async (req, res) => {
    try {
        const {
            query,
            page = 1,
            limit = 10,
            sortBy = "timestamp",
            sortOrder = "desc",
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        };

        const searchQuery = {
            $or: [
                { fromAddress: { $regex: query, $options: "i" } },
                { toAddress: { $regex: query, $options: "i" } },
                { eventType: { $regex: query, $options: "i" } },
            ],
        };

        const transactions = await Transaction.paginate(searchQuery, options);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            message: "Error searching transactions",
            error: error.message,
        });
    }
};
