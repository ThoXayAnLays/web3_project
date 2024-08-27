const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { isAdmin } = require("../middleware/authMiddleware");

router.get("/user/:address", transactionController.getUserTransactions);
router.get("/all", transactionController.getAllTransactions);
// router.get("/search", transactionController.searchTransactions);

module.exports = router;
