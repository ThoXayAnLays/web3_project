const Joi = require('joi');
const Transaction = require('../models/transaction');
const validate = require('../middleware/validate');

const transactionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('timestamp', 'amount').default('timestamp'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    search: Joi.string().allow('').optional(),
});

async function getAllTransactions(req, res, next) {
    try {
        const { page, limit, sortBy, sortOrder, search } = req.query;
        const transactions = await Transaction.getAll(page, limit, sortBy, sortOrder, search);
        res.json(transactions);
    } catch (error) {
        next(error);
    }
}

async function getUserTransactions(req, res, next) {
    try {
        const { userAddress } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;
        const transactions = await Transaction.getByUser(userAddress, page, limit, sortBy, sortOrder);
        res.json(transactions);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllTransactions: [validate(transactionQuerySchema), getAllTransactions],
    getUserTransactions: [validate(transactionQuerySchema), getUserTransactions],
};