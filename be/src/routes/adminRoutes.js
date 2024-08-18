const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.put('/apr', adminController.updateAPR);
router.get('/transactions', adminController.getAllTransactions);
router.get('/jobs', adminController.getJobs);
router.post('/jobs/retry', adminController.retryJob);

module.exports = router;