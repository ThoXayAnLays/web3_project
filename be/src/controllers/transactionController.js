const Transaction = require("../models/Transaction");
const LastCrawledBlock = require("../models/LastCrawledBlock");

exports.getUserTransactions = async (req, res) => {
    try {
        const { address } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = "timestamp",
            sortOrder = "desc",
            search = "",
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        };

        const searchQuery = search
            ? {
                  $or: [
                      { fromAddress: { $regex: search, $options: "i" } },
                      { toAddress: { $regex: search, $options: "i" } },
                      { eventType: { $regex: search, $options: "i" } },
                      { blockNumber: { $regex: search, $options: "i" } },
                      { transactionHash: { $regex: search, $options: "i" } },
                  ],
              }
            : {};

        const query = {
            $and: [
                { $or: [{ fromAddress: address }, { toAddress: address }] },
                searchQuery,
            ],
        };

        const transactions = await Transaction.paginate(query, options);

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching user transactions:", error);
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
            search = "",
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        };

        const searchQuery = search
            ? {
                  $or: [
                      { fromAddress: { $regex: search, $options: "i" } },
                      { toAddress: { $regex: search, $options: "i" } },
                      { eventType: { $regex: search, $options: "i" } },
                      { blockNumber: { $regex: search, $options: "i" } },
                      { transactionHash: { $regex: search, $options: "i" } },
                  ],
              }
            : {};

        const transactions = await Transaction.paginate(searchQuery, options);

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        res.status(500).json({
            message: "Error fetching all transactions",
            error: error.message,
        });
    }
};

exports.getLastCrawledBlock = async (req, res) => {
    try {
        const lastCrawled = await LastCrawledBlock.findOne({ contractName: "Staking" });
        res.json({ lastCrawledBlock: lastCrawled ? lastCrawled.blockNumber : null });
    } catch (error) {
        console.error("Error fetching last crawled block:", error);
        res.status(500).json({ error: "Failed to fetch last crawled block" });
    }
};