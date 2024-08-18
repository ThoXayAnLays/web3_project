const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const JobService = require('../services/jobService');
const Web3 = require('web3');

const web3 = new Web3(process.env.ETHEREUM_NODE_URL);

exports.updateAPR = async (req, res) => {
    const { newAPR } = req.body;
    // Implement contract interaction to update APR
    res.json({ success: true, message: 'APR updated successfully' });
};

exports.getAllTransactions = async (req, res) => {
    const { page, limit, sortBy, sortOrder, search } = req.query;
    const transactions = await Transaction.getAll(page, limit, sortBy, sortOrder, search);
    res.json(transactions);
};

exports.getJobs = async (req, res) => {
    const { page, limit, sortBy, sortOrder, search } = req.query;
    const jobs = await Job.getAll(page, limit, sortBy, sortOrder, search);
    res.json(jobs);
};

exports.retryJob = async (req, res) => {
    const { jobId } = req.body;
    await JobService.retryJob(jobId);
    res.json({ success: true, message: 'Job retry initiated' });
};