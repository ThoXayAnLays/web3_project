const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');
const { isAdmin } = require('../middleware/auth');

// Get all jobs (admin only)
router.get('/', isAdmin, (req, res) => {
    const jobs = Object.values(schedule.scheduledJobs).map(job => ({
        name: job.name,
        nextInvocation: job.nextInvocation(),
    }));
    res.json(jobs);
});

// Pause a job (admin only)
router.post('/:name/pause', isAdmin, (req, res) => {
    const { name } = req.params;
    const job = schedule.scheduledJobs[name];
    if (job) {
        job.cancel();
        res.json({ message: 'Job paused successfully' });
    } else {
        res.status(404).json({ message: 'Job not found' });
    }
});

// Resume a job (admin only)
router.post('/:name/resume', isAdmin, (req, res) => {
    const { name } = req.params;
    // For simplicity, we'll just reschedule the crawlTransactions job
    // In a real-world scenario, you might want to store job configurations separately
    if (name === 'crawlTransactions') {
        schedule.scheduleJob(name, '*/5 * * * *', require('../utils/cronJobs').crawlTransactions);
        res.json({ message: 'Job resumed successfully' });
    } else {
        res.status(404).json({ message: 'Job not found' });
    }
});

module.exports = router;