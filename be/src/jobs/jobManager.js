const { crawlEvents } = require("./cronJobs");

const jobs = {
    crawlEvents: {
        name: "Crawl Events",
        status: "idle",
        lastRun: null,
        run: crawlEvents,
    },
    // Add more jobs here as needed
};

exports.getJobStatus = async () => {
    return Object.keys(jobs).map((jobName) => ({
        name: jobs[jobName].name,
        status: jobs[jobName].status,
        lastRun: jobs[jobName].lastRun,
    }));
};

exports.runJob = async (jobName) => {
    if (!jobs[jobName]) {
        throw new Error(`Job ${jobName} not found`);
    }

    const job = jobs[jobName];
    job.status = "running";

    try {
        await job.run();
        job.status = "completed";
        job.lastRun = new Date();
        return { message: `Job ${jobName} completed successfully` };
    } catch (error) {
        job.status = "failed";
        console.error(`Error running job ${jobName}:`, error);
        throw new Error(`Job ${jobName} failed: ${error.message}`);
    }
};
