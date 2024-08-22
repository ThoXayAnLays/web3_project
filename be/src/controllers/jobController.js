const { getJobStatus, runJob } = require("../jobs/jobManager");

exports.getJobStatus = async (req, res) => {
    try {
        const status = await getJobStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching job status",
            error: error.message,
        });
    }
};

exports.runJob = async (req, res) => {
    try {
        const { jobName } = req.body;
        const result = await runJob(jobName);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error running job",
            error: error.message,
        });
    }
};
