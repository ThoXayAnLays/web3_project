const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

router.get("/", async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sort = "timestamp",
        order = "desc",
    } = req.query;
    try {
        const transactions = await Transaction.find()
            .sort({ [sort]: order === "desc" ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json(transactions);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;
