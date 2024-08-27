const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { isAdmin } = require("../middleware/authMiddleware");

router.get("/status", jobController.getJobStatus);
router.post("/run", jobController.runJob);

module.exports = router;
