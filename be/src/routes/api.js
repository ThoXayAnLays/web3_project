const express = require('express');
const transactionController = require('../controllers/transactionController');
const Joi = require('joi');
const validate = require('../middleware/validate');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const addressSchema = Joi.object({
    userAddress: Joi.string().length(42).regex(/^0x[a-fA-F0-9]{40}$/).required(),
});

router.get('/transactions', adminAuth, transactionController.getAllTransactions);
router.get('/transactions/:userAddress', validate(addressSchema), transactionController.getUserTransactions);

router.get('/check-admin/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const isAdmin = await User.isAdmin(address);
        res.json({ isAdmin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;