const kue = require('kue');
const Job = require('../models/Job');

const queue = kue.createQueue({
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
});

class JobService {
    static createJob(type, data) {
        const job = queue.create(type, data)
            .attempts(3)
            .backoff({ delay: 60 * 1000, type: 'exponential' })
            .save();

        job.on('complete', async () => {
            await Job.update(job.id, 'completed');
        });

        job.on('failed', async () => {
            await Job.update(job.id, 'failed');
        });

        return Job.create({ jobId: job.id, status: 'pending', type, data });
    }

    static async retryJob(jobId) {
        const job = await kue.Job.get(jobId);
        job.inactive();
        return Job.update(jobId, 'pending');
    }
}

module.exports = JobService;